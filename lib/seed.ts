import { prisma } from './prisma';

export async function seedTags() {
  const tags = [
    // 玩法
    { name: '自动化工作流', category: 'PLAYSTYLE' },
    { name: 'AI 助手', category: 'PLAYSTYLE' },
    { name: '智能家居', category: 'PLAYSTYLE' },
    { name: '消息聚合', category: 'PLAYSTYLE' },
    { name: '日程管理', category: 'PLAYSTYLE' },
    { name: '笔记同步', category: 'PLAYSTYLE' },
    { name: '代码生成', category: 'PLAYSTYLE' },
    
    // 教程
    { name: '入门教程', category: 'TUTORIAL' },
    { name: '高级技巧', category: 'TUTORIAL' },
    { name: '最佳实践', category: 'TUTORIAL' },
    { name: '故障排查', category: 'TUTORIAL' },
    
    // 案例
    { name: '个人使用', category: 'CASE' },
    { name: '团队效率', category: 'CASE' },
    { name: '企业部署', category: 'CASE' },
    
    // 工具
    { name: 'Skills', category: 'TOOL' },
    { name: '集成', category: 'TOOL' },
    { name: 'API', category: 'TOOL' },
    
    // 更新
    { name: '版本发布', category: 'UPDATE' },
    { name: '新功能', category: 'UPDATE' },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
  }

  console.log(`Seeded ${tags.length} tags`);
}
