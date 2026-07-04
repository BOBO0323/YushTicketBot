import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder } from 'discord.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const setupTicketCommand = {
  data: new SlashCommandBuilder()
    .setName('setup_ticket')
    .setDescription('設定客服單面板 (僅限管理員)'),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: ['Ephemeral'] }); 

    try {
      const categories = await prisma.ticketCategory.findMany();
      if (categories.length === 0) {
        await interaction.editReply('❌ 資料庫中目前沒有任何客服分類。請先使用 `/add_ticket_category` 指令新增！');
        return;
      }

      // 取得全域面板設定
      let panel = await prisma.ticketPanel.findUnique({ where: { id: 1 } });
      if (!panel) {
        panel = { id: 1, title: '📩 聯繫客服', description: '如果您有任何問題，請選擇下方對應的服務類別，我們將為您開啟專屬的客服通道。', color: '#5865F2', imageUrl: null, thumbnailUrl: null, logChannelId: null, autoCloseHours: 24, updatedAt: new Date() };
      }

      const embed = new EmbedBuilder()
        .setTitle(panel.title)
        .setDescription(panel.description)
        .setColor(panel.color ? parseInt(panel.color.replace('#', ''), 16) : 0x5865F2);

      if (panel.imageUrl) embed.setImage(panel.imageUrl);
      if (panel.thumbnailUrl) embed.setThumbnail(panel.thumbnailUrl);

      // Option A: 下拉式選單
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('ticket_select')
        .setPlaceholder('選擇您需要的服務類別...')
        .setMinValues(1)
        .setMaxValues(1);

      for (const cat of categories) {
        let emojiToSet = cat.emoji.trim();
        // 如果是自定義表情符號格式 <:name:id>，discord.js 允許直接傳入，但有時候我們需要確保安全。
        // v14 的 setEmoji 支援字串 (例如 '<:yush:123456789>') 或是單純的 ID ('123456789')
        
        const option = new StringSelectMenuOptionBuilder()
          .setLabel(cat.label)
          .setValue(`create_ticket_${cat.code}`)
          .setDescription(`開啟 ${cat.label} 客服單`);
        
        try {
          option.setEmoji(emojiToSet);
        } catch (e) {
          console.error(`Error setting emoji ${emojiToSet} for category ${cat.code}`);
        }
        
        selectMenu.addOptions(option);
      }

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      if (interaction.channel) {
        await (interaction.channel as any).send({
          embeds: [embed],
          components: [row]
        });
        await interaction.editReply('✅ 客服單面板已成功建立在此頻道。');
      } else {
        await interaction.editReply('❌ 無法在此頻道建立面板。');
      }
    } catch (error) {
      console.error('Error fetching ticket categories:', error);
      await interaction.editReply('❌ 讀取客服單設定時發生錯誤。');
    }
  }
};
