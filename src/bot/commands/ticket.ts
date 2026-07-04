import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const setupTicketCommand = {
  data: new SlashCommandBuilder()
    .setName('setup_ticket')
    .setDescription('設定客服單面板 (僅限管理員)'),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: ['Ephemeral'] }); 

    try {
      // 從資料庫讀取所有設定好的類別
      const categories = await prisma.ticketCategory.findMany({
        orderBy: { createdAt: 'asc' }
      });

      if (categories.length === 0) {
        await interaction.editReply('❌ 資料庫中目前沒有任何客服分類。請先使用 `/add_ticket_category` 指令新增！');
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('📩 聯繫客服')
        .setDescription('如果您有任何問題，請點擊下方對應的按鈕，我們將為您開啟專屬的客服通道。')
        .setColor(0x5865F2); // Discord Blurple

      // Discord 一排按鈕最多 5 個，這裡為求簡單先全塞在一排（如果超過5個需要分多排）
      const row = new ActionRowBuilder<ButtonBuilder>();

      for (const cat of categories) {
        // 防止超過 5 個導致報錯
        if (row.components.length >= 5) break; 

        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`create_ticket_${cat.code}`)
            .setLabel(cat.label)
            .setEmoji(cat.emoji)
            .setStyle(ButtonStyle.Primary) // 全部預設使用藍色
        );
      }

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
