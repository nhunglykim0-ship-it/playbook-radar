# Supabase 设置指南（5 分钟完成）

## 步骤 1：创建 Supabase 项目

1. 访问 https://supabase.com
2. 点击 "Start your project" 或 "New project"
3. 填写：
   - **Name:** `playbook-radar`
   - **Database Password:** 生成一个强密码（保存好）
   - **Region:** `Singapore (ap-southeast-1)` (离中国最近)
4. 点击 "Create new project"
5. 等待 2-3 分钟创建完成

---

## 步骤 2：获取 DATABASE_URL

1. 进入项目 Dashboard
2. 左侧菜单：**Settings** (设置图标)
3. 点击 **Database**
4. 找到 **Connection string** 部分
5. 选择 **URI** 标签
6. 复制连接串，格式如下：
   ```
   postgresql://postgres.xxxxxxxxxxxxx:你的密码@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

---

## 步骤 3：更新 Vercel 环境变量

1. 访问 https://vercel.com/dashboard
2. 找到 `playbook-radar` 项目
3. 点击 **Settings**
4. 左侧菜单：**Environment Variables**
5. 找到 `DATABASE_URL`，点击 **Edit**
6. 粘贴刚才复制的 Supabase 连接串
7. 点击 **Save**

---

## 步骤 4：告诉我已完成

完成后回复："Supabase 已设置"

我会自动执行：
- 切换 Prisma Schema
- 推送数据库结构
- 重新部署 Vercel
- 验证数据迁移

---

## 费用说明

Supabase 免费层：
- ✅ 500MB 数据库
- ✅ 50,000 月活用户
- ✅ 足够个人项目使用

无需绑定信用卡。
