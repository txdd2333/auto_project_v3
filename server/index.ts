import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import { PlaywrightExecutor } from './playwright-executor.js'
import { WorkflowRunner } from './workflow-runner.js'

const app = express()
const PORT = process.env.PLAYWRIGHT_PORT || 3001

app.use(cors())
app.use(express.json())

const playwrightExecutor = new PlaywrightExecutor()
const workflowRunner = new WorkflowRunner(playwrightExecutor)

app.post('/api/playwright/execute', async (req, res) => {
  try {
    const { workflow, variables } = req.body

    if (!workflow) {
      return res.status(400).json({ error: 'Workflow is required' })
    }

    const executionId = await workflowRunner.startExecution(workflow, variables || {})

    res.json({
      success: true,
      executionId,
      message: 'Workflow execution started'
    })
  } catch (error: any) {
    console.error('Execution error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute workflow'
    })
  }
})

app.post('/api/playwright/test-module', async (req, res) => {
  try {
    const { module, workflow } = req.body

    if (!module || !workflow) {
      return res.status(400).json({ error: 'Module and workflow are required' })
    }

    const executionId = await workflowRunner.startExecution(workflow, {})

    await new Promise(resolve => setTimeout(resolve, 2000))

    res.json({
      success: true,
      executionId,
      message: 'Module test started'
    })
  } catch (error: any) {
    console.error('Test error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to test module'
    })
  }
})

app.post('/api/playwright/get-selector', async (req, res) => {
  try {
    const { url, workflow, nodeId } = req.body

    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }

    const { chromium } = await import('playwright')
    const browser = await chromium.launch({
      headless: false,
      args: ['--start-maximized', '--auto-open-devtools-for-tabs']
    })
    
    const context = await browser.newContext({
      viewport: null
    })
    
    // 重新设计代码结构，确保浏览器只在完成所有操作后才关闭
    try {
      const page = await context.newPage()
      
      // 如果提供了工作流数据，先执行工作流到当前节点
      if (workflow && workflow.nodes && workflow.edges && nodeId) {
        console.log(`📋 Executing workflow to get login state...`);
        
        // 找到起始节点
        const startNode = workflow.nodes.find(n => 
          n.type === 'start' || n.type === 'start-node' || 
          workflow.nodes.indexOf(n) === 0
        );
        
        if (!startNode) {
          throw new Error('No start node found in workflow');
        }
        
        // 递归执行节点，按照连接关系
        async function executeNodeRecursively(node: any): Promise<boolean> {
          // 如果当前节点是目标节点，停止执行
          if (node.id === nodeId) {
            console.log(`✅ Reached target node: ${node.id}, stopping execution`);
            return true;
          }
          
          console.log(`🔄 Executing node: ${node.id} (${node.type})`);
          
          // 根据节点类型执行相应操作
          if (node.type === 'playwright' || node.type === 'playwright-node' || 
              node.type === 'click' || node.type === 'fill' || node.type === 'extract_text') {
            // 兼容两种属性格式：node.properties 和 node.data.properties || node.data
            const nodeData = node.data || {};
            const props = node.properties || nodeData.properties || {};
            const action = props.action || node.type;
            
            console.log(`   📋 Node props: ${JSON.stringify(props)}`);
            console.log(`   🎯 Action: ${action}`);
            
            switch (action) {
              case 'open_tabs':
              case 'navigate':
              case 'open':
                if (props.url) {
                  console.log(`   🌐 Navigating to URL: ${props.url}`);
                  await page.goto(props.url, {
                    waitUntil: 'networkidle',
                    timeout: 60000
                  });
                }
                break;
              case 'click':
                if (props.selector) {
                  console.log(`   👆 Clicking selector: ${props.selector}`);
                  await page.click(props.selector, { timeout: 60000 });
                  await page.waitForLoadState('networkidle', { timeout: 60000 });
                }
                break;
              case 'fill':
                if (props.fillItems && Array.isArray(props.fillItems)) {
                  for (const item of props.fillItems) {
                    if (item.selector && item.value) {
                      console.log(`   ✍️ Filling ${item.selector} with: ${item.value}`);
                      await page.fill(item.selector, item.value, { timeout: 60000 });
                    }
                  }
                } else if (props.selector && (props.value || props.text)) {
                  const fillValue = props.value || props.text;
                  console.log(`   ✍️ Filling ${props.selector} with: ${fillValue}`);
                  await page.fill(props.selector, fillValue, { timeout: 60000 });
                }
                break;
              case 'wait':
                const waitTime = props.milliseconds || 1000;
                console.log(`   ⏱️ Waiting for ${waitTime}ms`);
                await page.waitForTimeout(waitTime);
                break;
            }
          }
          
          // 查找下一个节点
          const nextEdges = workflow.edges.filter(edge => 
            edge.sourceNodeId === node.id || edge.source === node.id
          );
          
          for (const edge of nextEdges) {
            const nextNodeId = edge.targetNodeId || edge.target;
            const nextNode = workflow.nodes.find(n => n.id === nextNodeId);
            if (nextNode) {
              const reachedTarget = await executeNodeRecursively(nextNode);
              if (reachedTarget) {
                return true;
              }
            }
          }
          
          return false;
        }
        
        // 开始执行工作流
        await executeNodeRecursively(startNode);
      }
      
      // 导航到URL（如果没有执行工作流或工作流执行后URL可能已变化）
      const currentUrl = page.url();
      console.log(`📍 Current URL after workflow execution: ${currentUrl}`);
      console.log(`🎯 Target URL: ${url}`);
      
      // 只有当页面不在目标URL上时才导航
      // 注意：不要重新导航到相同的URL，这会导致登录状态丢失
      if (currentUrl !== url) {
        console.log(`🔄 Navigating to URL: ${url}`);
        await page.goto(url, {
          waitUntil: 'networkidle', // 等待网络空闲
          timeout: 60000 // 60秒超时
        });
      } else {
        console.log(`✅ Already on target URL, skipping navigation to preserve login state`);
      }
      
      // 等待页面加载完成
      console.log('⏳ Waiting for page to load completely...');
      await page.waitForLoadState('networkidle', { timeout: 60000 });
      console.log('✅ Page loaded successfully');
      
      // 添加视觉反馈，让用户知道系统正在等待他们点击元素
      console.log('🎨 Injecting visual feedback...');
      await page.evaluate(() => {
        // 创建一个覆盖层，显示提示信息
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 999998;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        `;
        document.body.appendChild(overlay);
        
        // 创建提示文本
        const message = document.createElement('div');
        message.style.cssText = `
          background-color: white;
          color: black;
          padding: 20px 30px;
          border-radius: 8px;
          font-size: 16px;
          font-family: Arial, sans-serif;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          z-index: 999999;
        `;
        message.innerHTML = `
          <h2 style="margin: 0 0 10px 0;">请点击元素获取选择器</h2>
          <p style="margin: 0;">将鼠标移动到您想要获取选择器的元素上，然后点击它</p>
        `;
        overlay.appendChild(message);
        
        // 创建倒计时显示
        const countdown = document.createElement('div');
        countdown.style.cssText = `
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 10px 20px;
          border-radius: 20px;
          font-size: 14px;
          margin-top: 20px;
          z-index: 999999;
        `;
        countdown.textContent = '等待点击...';
        overlay.appendChild(countdown);
        
        // 创建一个高亮元素，用于显示当前悬停的元素
        const highlighter = document.createElement('div');
        highlighter.style.cssText = `
          position: fixed;
          pointer-events: none;
          background-color: rgba(0, 255, 0, 0.3);
          border: 2px solid #00ff00;
          z-index: 999997;
          transition: all 0.1s ease;
        `;
        document.body.appendChild(highlighter);
        
        // 鼠标移动事件，高亮显示当前悬停的元素
        document.addEventListener('mousemove', (e) => {
          const element = document.elementFromPoint(e.clientX, e.clientY);
          if (element instanceof HTMLElement) {
            const rect = element.getBoundingClientRect();
            highlighter.style.left = `${rect.left}px`;
            highlighter.style.top = `${rect.top}px`;
            highlighter.style.width = `${rect.width}px`;
            highlighter.style.height = `${rect.height}px`;
            highlighter.style.display = 'block';
          } else {
            highlighter.style.display = 'none';
          }
        });
      });
      
      // 等待用户点击元素
      console.log('👆 Please click on an element to get its selector...');
      
      // 使用更可靠的方法来等待用户点击
      console.log('⏳ Waiting for user click...');
      
      // 注入点击处理脚本
      console.log('📝 Injecting click handler...');
      // 使用字符串模板直接传递纯JavaScript代码，避免TypeScript生成__name函数
      const selector = await page.evaluate(`
        new Promise((resolve) => {
          // 点击事件处理函数
          function handleClick(e) {
            // 阻止默认事件，确保点击事件不会关闭页面
            e.preventDefault();
            e.stopPropagation();
            
            // 获取点击的元素
            const element = e.target;
            
            // 生成选择器
            function generateSelector(el) {
              if (!el || el.nodeType !== 1) return '';
              
              // 尝试获取唯一的CSS选择器
              if (el.id) {
                return '#' + el.id;
              }
              
              // 尝试获取class选择器
              if (el.className) {
                const classes = el.className.split(' ').filter(c => c);
                if (classes.length > 0) {
                  // 检查这个class选择器是否唯一
                  const sameClassElements = document.querySelectorAll('.' + classes[0]);
                  if (sameClassElements.length === 1) {
                    return '.' + classes[0];
                  }
                }
              }
              
              // 尝试生成更具体的选择器
              let selector = el.tagName.toLowerCase();
              
              // 添加class信息（如果有）
              if (el.className) {
                const classes = el.className.split(' ').filter(c => c);
                if (classes.length > 0) {
                  // 添加所有非空class，用.连接
                  selector += '.' + classes.join('.');
                }
              }
              
              // 添加nth-child信息
              const parent = el.parentElement;
              if (parent) {
                const siblings = Array.from(parent.children);
                const index = siblings.indexOf(el);
                // 总是添加nth-child，确保选择器的唯一性
                selector += ':nth-child(' + (index + 1) + ')';
              }
              
              // 向上递归，生成更完整的选择器
              const parentSelector = generateSelector(parent);
              if (parentSelector) {
                return parentSelector + ' > ' + selector;
              }
              
              // 确保至少返回标签名
              return selector;
            }
            
            // 生成选择器
            const generatedSelector = generateSelector(element);
            
            // 移除视觉反馈
            const overlay = document.querySelector('div[style*="z-index: 999998"]');
            const highlighter = document.querySelector('div[style*="z-index: 999997"]');
            if (overlay) overlay.remove();
            if (highlighter) highlighter.remove();
            
            // 移除事件监听器
            document.removeEventListener('click', handleClick);
            
            // 返回选择器
            resolve(generatedSelector);
          }
          
          // 添加点击事件监听器
          document.addEventListener('click', handleClick);
        });
      `);
      
      console.log('✅ Selector obtained:', selector);
      
      // 验证生成的选择器是否有效
      if (!selector) {
        throw new Error('Failed to generate selector for clicked element');
      }
      
      // 关闭浏览器
      await browser.close();
      
      res.json({
        success: true,
        selector,
        message: 'Selector obtained successfully'
      });
    } catch (error) {
      console.error('❌ Error in selector process:', error);
      // 关闭浏览器
      await browser.close();
      
      // 重新抛出错误，让外层catch处理
      throw error;
    }
  } catch (error: any) {
    console.error('Get selector error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get selector'
    })
  }
})

// 新增：获取当前URL的API端点
app.post('/api/playwright/get-current-url', async (req, res) => {
  try {
    const { nodeId, workflow, executeOptions } = req.body

    if (!workflow || !workflow.nodes) {
      return res.status(400).json({ error: 'Workflow data is required' })
    }

    console.log(`📥 Getting current URL up to node: ${nodeId}`);
    console.log(`📋 Workflow nodes: ${workflow.nodes.length}`);
    console.log(`⚙️ Execute options: ${JSON.stringify(executeOptions)}`);

    // 执行所有节点，直到遇到指定的节点
    const { chromium } = await import('playwright')
    const browser = await chromium.launch({
      headless: false,
      args: ['--start-maximized']
    })
    
    const context = await browser.newContext({
      viewport: null
    })
    
    try {
      const page = await context.newPage()
      let currentUrl = '';
      let reachedTargetNode = false;

      // 找到起始节点
      const startNode = workflow.nodes.find(n => 
        n.type === 'start' || n.type === 'start-node' || 
        // 如果没有起始节点，使用第一个节点
        workflow.nodes.indexOf(n) === 0
      );
      
      if (!startNode) {
        throw new Error('No start node found in workflow');
      }
      
      console.log(`🔍 Starting execution from node: ${startNode.id} (${startNode.type})`);
      
      // 递归执行节点，按照连接关系
      async function executeNodeRecursively(node: any): Promise<boolean> {
        // 如果设置了executeOptions.untilNodeId，并且当前节点是目标节点，则停止执行
        if (executeOptions?.untilNodeId && node.id === executeOptions.untilNodeId) {
          console.log(`✅ Reached target node: ${node.id}, stopping execution`);
          return true;
        }
        
        console.log(`🔄 Executing node: ${node.id} (${node.type})`);
        
        // 根据节点类型执行相应操作
        if (node.type === 'playwright' || node.type === 'playwright-node' || 
            node.type === 'click' || node.type === 'fill' || node.type === 'extract_text') {
          // 兼容两种属性格式：node.properties 和 node.data.properties || node.data
          const nodeData = node.data || {};
          const props = node.properties || nodeData.properties || {};
          const action = props.action || node.type;
          
          console.log(`   📋 Node props: ${JSON.stringify(props)}`);
          console.log(`   🎯 Action: ${action}`);
          
          switch (action) {
            case 'open_tabs':
              const urls = props.urls ? props.urls.split(',').map((u: string) => u.trim()) : [props.url || ''];
              if (urls[0]) {
                console.log(`   🌐 Opening tab: ${urls[0]}`);
                await page.goto(urls[0], { waitUntil: 'networkidle', timeout: 60000 });
                currentUrl = page.url();
                console.log(`   📍 Current URL: ${currentUrl}`);
              }
              break;
            
            case 'navigate':
            case 'open':
              if (props.url) {
                console.log(`   🚗 Navigating to: ${props.url}`);
                await page.goto(props.url, { waitUntil: 'networkidle', timeout: 60000 });
                currentUrl = page.url();
                console.log(`   📍 Current URL: ${currentUrl}`);
              }
              break;
            
            case 'click':
              if (props.selector) {
                console.log(`   👆 Clicking: ${props.selector}`);
                
                // 检查页面上有多少个匹配的元素
                const elementsCount = await page.locator(props.selector).count();
                console.log(`   🔍 Found ${elementsCount} elements matching selector: ${props.selector}`);
                
                // 显示每个元素的文本内容，帮助调试
                for (let i = 0; i < elementsCount; i++) {
                  const text = await page.locator(props.selector).nth(i).innerText();
                  const visible = await page.locator(props.selector).nth(i).isVisible();
                  console.log(`   📝 Element ${i}: "${text}" (visible: ${visible})`);
                }
                
                // 检查第一个元素是否可见
                const firstElementVisible = await page.locator(props.selector).nth(0).isVisible();
                
                if (firstElementVisible) {
                  // 获取第一个元素的文本内容，确认是登录按钮
                  const elementText = await page.locator(props.selector).nth(0).innerText();
                  console.log(`   📝 Clicking first element: "${elementText}"`);
                  
                  // 点击第一个元素
                  await page.locator(props.selector).nth(0).click({ timeout: 60000 });
                  
                  // 等待一段时间，确保页面有足够的时间进行跳转
                  console.log(`   ⏳ Waiting for 5 seconds after click...`);
                  await page.waitForTimeout(5000);
                  
                  // 等待页面加载完成，特别是登录等可能导致页面跳转的操作
                  console.log(`   ⏳ Waiting for page load after click...`);
                  await page.waitForLoadState('networkidle', { timeout: 60000 });
                  
                  // 再等待5秒，确保登录操作完成
                  console.log(`   ⏳ Waiting additional 5 seconds for login completion...`);
                  await page.waitForTimeout(5000);
                  
                  // 再次检查页面状态
                  await page.waitForLoadState('networkidle', { timeout: 60000 });
                  
                  // 获取当前URL
                  currentUrl = page.url();
                  console.log(`   📍 Current URL after click: ${currentUrl}`);
                  
                  // 检查页面标题
                  const pageTitle = await page.title();
                  console.log(`   📄 Page title after click: ${pageTitle}`);
                  
                  // 检查页面内容，确认是否登录成功
                  const pageContent = await page.content();
                  console.log(`   📄 Page contains "登录" (login): ${pageContent.includes('登录')}`);
                  console.log(`   📄 Page contains "用户名" (username): ${pageContent.includes('用户名')}`);
                  console.log(`   📄 Page contains "密码" (password): ${pageContent.includes('密码')}`);
                } else {
                  console.error(`   ❌ No visible elements found for selector: ${props.selector}`);
                }
              }
              break;
            
            case 'fill':
              // 支持多个填充项
              if (props.fillItems && Array.isArray(props.fillItems)) {
                for (const item of props.fillItems) {
                  if (item.selector && item.value) {
                    console.log(`   ✍️ Filling: ${item.selector} with '${item.value}'`);
                    await page.fill(item.selector, item.value, { timeout: 60000 });
                  }
                }
              } 
              // 兼容旧版单填充项
              else if (props.selector && props.value) {
                console.log(`   ✍️ Filling: ${props.selector} with '${props.value}'`);
                await page.fill(props.selector, props.value, { timeout: 60000 });
              }
              break;
            
            case 'wait':
              const waitMs = props.milliseconds || 1000;
              console.log(`   ⏱️ Waiting: ${waitMs}ms`);
              await page.waitForTimeout(waitMs);
              break;
          }
        }
        
        // 查找下一个节点（根据边连接关系）
        const nextEdges = workflow.edges.filter(e => 
          e.sourceNodeId === node.id || e.source === node.id
        );
        
        for (const edge of nextEdges) {
          const nextNodeId = edge.targetNodeId || edge.target;
          const nextNode = workflow.nodes.find(n => n.id === nextNodeId);
          
          if (nextNode) {
            console.log(`   🔀 Moving to next node: ${nextNode.id} (${nextNode.type}) via edge: ${edge.id}`);
            const reachedTarget = await executeNodeRecursively(nextNode);
            if (reachedTarget) {
              return true;
            }
          }
        }
        
        return false;
      }
      
      // 开始递归执行
      await executeNodeRecursively(startNode);

      // 获取最终的URL（登录后的URL）
      currentUrl = page.url();
      console.log(`✅ Final URL after all nodes: ${currentUrl}`);
      
      // 关闭浏览器
      await browser.close();
      
      res.json({
        success: true,
        url: currentUrl,
        message: `Current URL after all nodes obtained successfully`
      });
    } catch (error) {
      console.error('Error executing workflow to get current URL:', error);
      // 关闭浏览器
      await browser.close();
      
      // 返回具体的错误信息
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to execute workflow to get current URL',
        details: error.stack
      });
    }
  } catch (error: any) {
    console.error('Get current URL error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get current URL'
    })
  }
})

app.get('/api/playwright/execution/:id', async (req, res) => {
  try {
    const { id } = req.params
    const status = workflowRunner.getExecutionStatus(id)

    if (!status) {
      return res.status(404).json({ error: 'Execution not found' })
    }

    res.json(status)
  } catch (error: any) {
    console.error('Status error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/playwright/execution/:id/stream', async (req, res) => {
  const { id } = req.params

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const sendUpdate = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  workflowRunner.onExecutionUpdate(id, sendUpdate)

  req.on('close', () => {
    workflowRunner.offExecutionUpdate(id, sendUpdate)
  })
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'playwright-backend' })
})

app.listen(PORT, () => {
  console.log(`🚀 Playwright Backend Server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})
