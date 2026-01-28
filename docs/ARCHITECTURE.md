# 运维工作流中心 - 可移植架构设计文档

## 📐 架构概览

本项目已完成从 **Supabase 深度耦合** 到 **服务抽象层架构** 的重构，实现了**100% 可移植性**。

### 架构分层

```
┌─────────────────────────────────────────────────────────┐
│  UI 层 (React Components)                                │
│  - Pages: WorkflowsPage, ScenariosPage, etc.           │
│  - Components: MarkdownEditor, ReactFlowEditor          │
└────────────────────┬────────────────────────────────────┘
                     │ 使用接口
┌────────────────────┴────────────────────────────────────┐
│  抽象层 (Service Interfaces)                            │
│  - IAuthService:     认证服务接口                        │
│  - IDataService:     数据服务接口                        │
│  - IStorageService:  存储服务接口                        │
└────────────────────┬────────────────────────────────────┘
                     │ 实现
┌────────────────────┴────────────────────────────────────┐
│  服务工厂 (ServiceFactory)                              │
│  - 根据环境变量选择实现                                  │
│  - VITE_SERVICE_PROVIDER: 'supabase' | 'custom'        │
└────────────────────┬────────────────────────────────────┘
        ┌────────────┴────────────┐
        │                         │
┌───────┴────────┐       ┌────────┴────────┐
│ Supabase 实现  │       │  自定义实现      │
│ (开发环境)      │       │  (生产环境)      │
│                │       │                  │
│ - Supabase     │       │ - OceanBase     │
│ - PostgreSQL   │       │ - MySQL         │
│ - Auth         │       │ - JWT           │
│ - Storage      │       │ - MinIO         │
└────────────────┘       └─────────────────┘
```

---

## 🎯 核心设计原则

### 1. 接口优先 (Interface-First)

所有服务通过统一接口定义，业务代码只依赖接口：

```typescript
// 接口定义
export interface IAuthService {
  signIn(email: string, password: string): Promise<AuthResult>
  signUp(email: string, password: string): Promise<AuthResult>
  signOut(): Promise<void>
  getSession(): Promise<Session | null>
  onAuthStateChange(callback): Unsubscribe
}

// 业务代码使用
import { authService } from '@/services'
await authService.signIn(email, password)
```

### 2. 依赖注入 (Dependency Injection)

通过工厂模式统一管理服务实例：

```typescript
// ServiceFactory.ts
static getAuthService(): IAuthService {
  const provider = import.meta.env.VITE_SERVICE_PROVIDER

  switch (provider) {
    case 'supabase':
      return new SupabaseAuthService()
    case 'custom':
      return new CustomAuthService()
  }
}
```

### 3. 配置驱动 (Configuration-Driven)

通过环境变量切换不同实现，零代码改动：

```bash
# 开发环境 (.env)
VITE_SERVICE_PROVIDER=supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# 生产环境 (.env.production)
VITE_SERVICE_PROVIDER=custom
VITE_API_URL=https://api.example.com
VITE_API_KEY=xxx
```

---

## 📁 项目结构

```
src/
├── services/                    # 服务抽象层
│   ├── types.ts                 # 通用类型定义
│   ├── ServiceFactory.ts        # 服务工厂
│   ├── index.ts                 # 统一导出
│   ├── auth/                    # 认证服务
│   │   ├── IAuthService.ts      # 接口定义
│   │   └── SupabaseAuthService.ts  # Supabase 实现
│   ├── data/                    # 数据服务
│   │   ├── IDataService.ts      # 接口定义
│   │   └── SupabaseDataService.ts  # Supabase 实现
│   └── storage/                 # 存储服务
│       ├── IStorageService.ts   # 接口定义
│       └── SupabaseStorageService.ts  # Supabase 实现
├── pages/                       # 页面组件（已重构）
│   ├── WorkflowsPage.tsx       # ✅ 使用 dataService
│   ├── ScenariosPage.tsx       # ✅ 使用 dataService
│   ├── ExecutionLogsPage.tsx   # ✅ 使用 dataService
│   ├── ModulesPage.tsx         # ✅ 使用 dataService
│   └── ...
├── components/                  # 组件（已重构）
│   ├── MarkdownEditor.tsx      # ✅ 使用 authService + storageService
│   └── ...
└── contexts/                    # 上下文（已重构）
    └── AuthContext.tsx         # ✅ 使用 authService
```

---

## 🔄 重构清单

### ✅ 已完成

| 模块 | 重构内容 | 状态 |
|------|---------|------|
| **服务接口** | 创建 IAuthService、IDataService、IStorageService | ✅ |
| **Supabase 适配器** | 实现 SupabaseAuthService、SupabaseDataService、SupabaseStorageService | ✅ |
| **服务工厂** | ServiceFactory + 配置管理 | ✅ |
| **AuthContext** | 重构为使用 authService | ✅ |
| **页面组件** | WorkflowsPage、ScenariosPage、ExecutionLogsPage、ModulesPage 等 | ✅ |
| **其他组件** | MarkdownEditor、ScenarioDetailPage、WorkflowEditorPage | ✅ |
| **MySQL Schema** | 创建 MySQL 8.0+ 兼容的数据库脚本 | ✅ |
| **构建验证** | npm run build 成功 | ✅ |

### ⏳ 待实现（生产环境）

| 模块 | 实现内容 | 优先级 |
|------|---------|-------|
| **CustomAuthService** | 基于 JWT 的认证服务 | P0 |
| **CustomDataService** | 基于 REST API + MySQL 的数据服务 | P0 |
| **CustomStorageService** | 基于 MinIO 或本地文件系统的存储服务 | P1 |
| **后端 API** | Node.js + Express + MySQL | P0 |
| **数据迁移脚本** | PostgreSQL → MySQL 数据迁移 | P1 |

---

## 🔌 接口定义

### IAuthService (认证服务)

```typescript
interface IAuthService {
  // 登录
  signIn(email: string, password: string): Promise<AuthResult>

  // 注册
  signUp(email: string, password: string): Promise<AuthResult>

  // 登出
  signOut(): Promise<void>

  // 获取当前会话
  getSession(): Promise<Session | null>

  // 获取当前用户
  getCurrentUser(): Promise<User | null>

  // 监听认证状态变化
  onAuthStateChange(callback: (session: Session | null) => void): Unsubscribe
}
```

### IDataService (数据服务)

```typescript
interface IDataService {
  // 查询多条记录
  query<T>(table: string, options?: QueryOptions): Promise<QueryArrayResult<T>>

  // 查询单条记录
  queryOne<T>(table: string, options?: QueryOptions): Promise<QueryResult<T>>

  // 插入记录
  insert<T>(table: string, data: Partial<T> | Partial<T>[]): Promise<QueryResult<T> | QueryArrayResult<T>>

  // 更新记录
  update<T>(table: string, id: string, data: Partial<T>): Promise<QueryResult<T>>

  // 删除记录
  delete(table: string, id: string): Promise<{ error: Error | null }>

  // 实时订阅
  subscribe(table: string, callback: (event: string, payload: any) => void): () => void
}
```

### IStorageService (存储服务)

```typescript
interface IStorageService {
  // 上传文件
  upload(bucket: string, path: string, file: File | Blob): Promise<UploadResult>

  // 下载文件
  download(bucket: string, path: string): Promise<Blob | null>

  // 删除文件
  delete(bucket: string, path: string): Promise<{ error: Error | null }>

  // 获取公开URL
  getPublicUrl(bucket: string, path: string): string

  // 列出文件
  list(bucket: string, path?: string): Promise<{ data: any[] | null; error: Error | null }>
}
```

---

## 🛠️ 使用指南

### 开发阶段（当前）

使用 Supabase 进行开发：

```bash
# .env
VITE_SERVICE_PROVIDER=supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 启动开发服务器
npm run dev
```

### 生产环境（切换后端）

1. **实现自定义服务**

```typescript
// src/services/auth/CustomAuthService.ts
export class CustomAuthService implements IAuthService {
  async signIn(email: string, password: string): Promise<AuthResult> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await response.json()
    return { user: data.user, session: data.session, error: null }
  }
  // ... 其他方法实现
}
```

2. **更新服务工厂**

```typescript
// src/services/ServiceFactory.ts
case 'custom':
  this.authServiceInstance = new CustomAuthService()
  break
```

3. **修改环境变量**

```bash
# .env.production
VITE_SERVICE_PROVIDER=custom
VITE_API_URL=https://api.example.com
VITE_API_KEY=your-api-key
```

4. **零代码改动**

前端业务代码无需修改，直接构建部署：

```bash
npm run build
```

---

## 📊 数据库兼容性

### PostgreSQL → MySQL 映射

| PostgreSQL | MySQL 8.0+ | 说明 |
|------------|-----------|------|
| `uuid` | `CHAR(36)` | UUID 字符串格式 |
| `jsonb` | `JSON` | MySQL 原生 JSON 类型 |
| `timestamptz` | `DATETIME` | 时间戳 |
| `gen_random_uuid()` | 应用层生成 | 使用 `crypto.randomUUID()` |
| `now()` | `CURRENT_TIMESTAMP` | 当前时间 |
| RLS 策略 | 应用层控制 | WHERE user_id = ? |

完整 MySQL Schema 见：`docs/mysql-schema.sql`

---

## 🚀 迁移路径

### 阶段 1：抽象层开发 ✅ (已完成)

- ✅ 创建服务接口定义
- ✅ 实现 Supabase 适配器
- ✅ 重构所有业务代码
- ✅ 验证构建成功

### 阶段 2：后端服务开发 (1-2 周)

- [ ] 实现 Node.js REST API
- [ ] 实现 JWT 认证
- [ ] 实现数据 CRUD
- [ ] 实现文件上传

### 阶段 3：生产部署 (1 周)

- [ ] 部署 OceanBase/MySQL
- [ ] 部署后端服务
- [ ] 数据迁移
- [ ] 环境变量切换
- [ ] 全量测试

---

## 🎯 优势总结

### ✅ 技术独立性

- 不依赖任何特定云服务商
- 避免供应商锁定
- 随时可切换后端

### ✅ 成本优化

- Supabase 收费 vs 自托管免费
- 可根据需求选择最优方案

### ✅ 数据安全

- 敏感数据可留在本地
- 符合数据合规要求

### ✅ 性能可控

- OceanBase 高性能
- 可针对性优化查询

### ✅ 扩展性强

- 支持多种数据库（TiDB、PostgreSQL）
- 支持多种存储方案（S3、MinIO、本地）

---

## 📝 最佳实践

### 1. 业务代码规范

```typescript
// ✅ 正确：使用抽象层
import { dataService } from '@/services'
const { data } = await dataService.query<Workflow>('workflows')

// ❌ 错误：直接使用 Supabase
import { supabase } from '@/lib/supabase'
const { data } = await supabase.from('workflows').select('*')
```

### 2. 错误处理

```typescript
const { data, error } = await dataService.query('workflows')

if (error) {
  console.error('Query failed:', error)
  return
}

// 使用 data
```

### 3. TypeScript 类型

```typescript
// 使用泛型保持类型安全
const { data } = await dataService.query<Workflow>('workflows')
// data 类型为 Workflow[]
```

---

## 🔍 故障排查

### 问题：服务工厂返回错误

**检查环境变量**
```bash
echo $VITE_SERVICE_PROVIDER
# 应该输出: supabase 或 custom
```

### 问题：类型错误

**确认导入正确**
```typescript
import { dataService } from '@/services'  // ✅
import { supabase } from '@/lib/supabase'  // ❌
```

---

## 📞 技术支持

- 架构问题：参考本文档
- Supabase 问题：https://supabase.com/docs
- TypeScript 问题：https://www.typescriptlang.org/docs

---

**文档版本**: v1.0
**最后更新**: 2026-01-18
**架构师**: Claude (Anthropic)
