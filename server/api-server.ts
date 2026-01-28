import dotenv from 'dotenv'
dotenv.config()

import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'ops_workflow_center',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads')
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const bucket = req.body.bucket || 'default'
    const bucketPath = path.join(UPLOAD_DIR, bucket)
    if (!fs.existsSync(bucketPath)) {
      fs.mkdirSync(bucketPath, { recursive: true })
    }
    cb(null, bucketPath)
  },
  filename: (req, file, cb) => {
    const customPath = req.body.path || `${Date.now()}-${file.originalname}`
    cb(null, customPath)
  },
})

const upload = multer({ storage })

interface AuthRequest extends Request {
  userId?: string
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' })
    }
    req.userId = decoded.userId
    next()
  })
}

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const [existingUsers] = await pool.query(
      'SELECT id FROM user_profiles WHERE email = ?',
      [email]
    )

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const userId = crypto.randomUUID()

    await pool.query(
      'INSERT INTO user_profiles (id, email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [userId, email, passwordHash, 'read_only', 'pending']
    )

    res.json({
      message: 'Registration successful. Please wait for admin approval.',
      status: 'pending'
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const [user_profiles] = await pool.query(
      'SELECT id, email, password_hash, role, status FROM user_profiles WHERE email = ?',
      [email]
    )

    if (!Array.isArray(user_profiles) || user_profiles.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const user = user_profiles[0] as any

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is pending approval. Please wait for admin to approve your account.' })
    }

    if (user.status === 'locked') {
      return res.status(403).json({ message: 'Your account has been locked. Please contact administrator.' })
    }

    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    await pool.query(
      'UPDATE user_profiles SET last_login_at = NOW() WHERE id = ?',
      [user.id]
    )

    const accessToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    res.json({
      user: { id: user.id, email: user.email, role: user.role },
      access_token: accessToken,
      refresh_token: accessToken,
      expires_at: expiresAt,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.get('/api/data/:table', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { table } = req.params
    const userId = req.userId

    const allowedTables = ['modules', 'workflows', 'scenarios', 'execution_logs', 'user_profiles', 'ai_configs', 'sop_documents']
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ message: 'Invalid table name' })
    }

    let query = `SELECT * FROM ${table}`
    const params: any[] = []
    const conditions: string[] = []

    if (table === 'user_profiles') {
      Object.keys(req.query).forEach((key) => {
        if (key.startsWith('filter_')) {
          const field = key.replace('filter_', '')
          conditions.push(`${field} = ?`)
          params.push(req.query[key])
        }
      })
    } else {
      conditions.push('user_id = ?')
      params.push(userId)

      Object.keys(req.query).forEach((key) => {
        if (key.startsWith('filter_')) {
          const field = key.replace('filter_', '')
          conditions.push(`${field} = ?`)
          params.push(req.query[key])
        }
      })
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    if (req.query.order) {
      const [column, direction] = (req.query.order as string).split(':')
      query += ` ORDER BY ${column} ${direction.toUpperCase()}`
    }

    if (req.query.limit) {
      query += ` LIMIT ?`
      params.push(parseInt(req.query.limit as string))
    }

    if (req.query.offset) {
      query += ` OFFSET ?`
      params.push(parseInt(req.query.offset as string))
    }

    const [rows] = await pool.query(query, params)

    res.json({ data: rows })
  } catch (error) {
    console.error('Query error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.post('/api/data/:table', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { table } = req.params
    const userId = req.userId
    const { data } = req.body

    const allowedTables = ['modules', 'workflows', 'scenarios', 'execution_logs', 'ai_configs', 'sop_documents']
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ message: 'Invalid table name' })
    }

    const records = Array.isArray(data) ? data : [data]
    const insertedRecords = []

    for (const record of records) {
      const id = crypto.randomUUID()
      const recordWithMeta = {
        ...record,
        id,
        user_id: userId,
        created_at: new Date(),
      }

      const columns = Object.keys(recordWithMeta)
      const values = Object.values(recordWithMeta)
      const placeholders = columns.map(() => '?').join(', ')

      await pool.query(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      )

      insertedRecords.push(recordWithMeta)
    }

    res.json({ data: insertedRecords })
  } catch (error) {
    console.error('Insert error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.put('/api/data/:table/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { table, id } = req.params
    const userId = req.userId
    const { data } = req.body

    const allowedTables = ['modules', 'workflows', 'scenarios', 'execution_logs', 'user_profiles', 'ai_configs', 'sop_documents']
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ message: 'Invalid table name' })
    }

    const updates = Object.entries(data)
      .filter(([key]) => key !== 'id' && key !== 'user_id')
      .map(([key]) => `${key} = ?`)
      .join(', ')

    const values = Object.entries(data)
      .filter(([key]) => key !== 'id' && key !== 'user_id')
      .map(([, value]) => value)

    if (table === 'user_profiles') {
      values.push(id)
      await pool.query(
        `UPDATE ${table} SET ${updates}, updated_at = NOW() WHERE id = ?`,
        values
      )

      const [rows] = await pool.query(
        `SELECT * FROM ${table} WHERE id = ?`,
        [id]
      )

      res.json({ data: Array.isArray(rows) && rows.length > 0 ? rows[0] : null })
    } else {
      values.push(id, userId)
      await pool.query(
        `UPDATE ${table} SET ${updates}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
        values
      )

      const [rows] = await pool.query(
        `SELECT * FROM ${table} WHERE id = ? AND user_id = ?`,
        [id, userId]
      )

      res.json({ data: Array.isArray(rows) && rows.length > 0 ? rows[0] : null })
    }
  } catch (error) {
    console.error('Update error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.delete('/api/data/:table/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { table, id } = req.params
    const userId = req.userId

    const allowedTables = ['modules', 'workflows', 'scenarios', 'execution_logs', 'ai_configs', 'sop_documents']
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ message: 'Invalid table name' })
    }

    await pool.query(
      `DELETE FROM ${table} WHERE id = ? AND user_id = ?`,
      [id, userId]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.post('/api/storage/upload', authenticateToken, upload.single('file'), (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const bucket = req.body.bucket || 'default'
    const filePath = req.file.filename

    res.json({ path: filePath, bucket })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.get('/api/storage/public/:bucket/:path', (req: Request, res: Response) => {
  try {
    const { bucket, path: filePath } = req.params
    const fullPath = path.join(UPLOAD_DIR, bucket, filePath)

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'File not found' })
    }

    res.sendFile(fullPath)
  } catch (error) {
    console.error('Download error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.get('/api/user_profiles', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    let query = 'SELECT id, email, phone, role, status, created_at, last_login_at FROM user_profiles WHERE 1=1'
    const params: any[] = []

    if (req.query.filter_id) {
      query += ' AND id = ?'
      params.push(req.query.filter_id)
    }

    if (req.query.filter_email) {
      query += ' AND email = ?'
      params.push(req.query.filter_email)
    }

    if (req.query.status) {
      query += ' AND status = ?'
      params.push(req.query.status)
    }

    if (req.query.role) {
      query += ' AND role = ?'
      params.push(req.query.role)
    }

    if (req.query.order) {
      const [column, direction] = (req.query.order as string).split(':')
      query += ` ORDER BY ${column} ${direction.toUpperCase()}`
    } else {
      query += ' ORDER BY created_at DESC'
    }

    if (req.query.limit) {
      query += ' LIMIT ?'
      params.push(parseInt(req.query.limit as string))
    }

    if (req.query.offset) {
      query += ' OFFSET ?'
      params.push(parseInt(req.query.offset as string))
    }

    const [rows] = await pool.query(query, params)
    res.json({ data: rows })
  } catch (error) {
    console.error('Get user_profiles error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.post('/api/user_profiles', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, phone, role, status } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM user_profiles WHERE email = ?',
      [email]
    )

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const userId = crypto.randomUUID()

    await pool.query(
      'INSERT INTO user_profiles (id, email, password_hash, phone, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [userId, email, passwordHash, phone || null, role || 'read_only', status || 'active']
    )

    res.json({
      success: true,
      data: {
        id: userId,
        email,
        role: role || 'read_only',
        status: status || 'active'
      }
    })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.get('/api/user_profiles/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const [user_profiles] = await pool.query(
      'SELECT id, email, phone, role, status, created_at, last_login_at FROM user_profiles WHERE id = ?',
      [id]
    )

    if (!Array.isArray(user_profiles) || user_profiles.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ data: user_profiles[0] })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.put('/api/user_profiles/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const updates = req.body

    const allowedFields = ['email', 'phone', 'role', 'status']
    const updateFields = []
    const updateValues = []

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`)
        updateValues.push(value)
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' })
    }

    updateValues.push(id)
    await pool.query(
      `UPDATE user_profiles SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      updateValues
    )

    const [user_profiles] = await pool.query(
      'SELECT id, email, phone, role, status, created_at, last_login_at FROM user_profiles WHERE id = ?',
      [id]
    )

    res.json({ data: Array.isArray(user_profiles) && user_profiles.length > 0 ? user_profiles[0] : null })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.delete('/api/user_profiles/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    if (id === req.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' })
    }

    // 软删除：标记为 deleted 状态
    await pool.query(
      'UPDATE user_profiles SET status = ?, updated_at = NOW() WHERE id = ?',
      ['deleted', id]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// 彻底删除用户（永久删除）
app.delete('/api/user_profiles/:id/permanent', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    if (id === req.userId) {
      return res.status(400).json({ message: 'Cannot permanently delete your own account' })
    }

    // 检查用户是否已经是 deleted 状态
    const [user_profiles] = await pool.query(
      'SELECT status FROM user_profiles WHERE id = ?',
      [id]
    )

    if (!Array.isArray(user_profiles) || user_profiles.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const userStatus = (user_profiles[0] as any).status
    if (userStatus !== 'deleted') {
      return res.status(400).json({
        message: 'Only user_profiles with deleted status can be permanently removed. Please delete the user first.'
      })
    }

    // 彻底删除用户相关的所有数据
    // 1. 删除用户创建的数据
    await pool.query('DELETE FROM execution_logs WHERE user_id = ?', [id])
    await pool.query('DELETE FROM scenarios WHERE user_id = ?', [id])
    await pool.query('DELETE FROM workflows WHERE user_id = ?', [id])
    await pool.query('DELETE FROM modules WHERE user_id = ?', [id])

    // 2. 删除用户记录
    await pool.query('DELETE FROM user_profiles WHERE id = ?', [id])

    res.json({
      success: true,
      message: 'User permanently deleted. The email can now be re-registered.'
    })
  } catch (error) {
    console.error('Permanent delete user error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`)
  console.log(`Environment:`)
  console.log(`  - DB_HOST: ${process.env.DB_HOST || 'localhost'}`)
  console.log(`  - DB_PORT: ${process.env.DB_PORT || '3306'}`)
  console.log(`  - DB_USER: ${process.env.DB_USER || 'root'}`)
  console.log(`  - DB_DATABASE: ${process.env.DB_DATABASE || 'ops_workflow_center'}`)
  console.log(`  - UPLOAD_DIR: ${UPLOAD_DIR}`)
})
