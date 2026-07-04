import { SlashCommandBuilder, ChatInputCommandInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const addTicketCategoryCommand = {
  data: new SlashCommandBuilder()
    .setName('add_ticket_category')
    .setDescription('新增客服單分類 (管理員專用)'),
  async execute(interaction: ChatInputCommandInteraction) {
    const modal = new ModalBuilder()
      .setCustomId('add_ticket_category_modal')
      .setTitle('新增客服單分類');

    const codeInput = new TextInputBuilder()
      .setCustomId('codeInput')
      .setLabel('內部代號 (英文, 不能重複, 例: purchase)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const labelInput = new TextInputBuilder()
      .setCustomId('labelInput')
      .setLabel('按鈕顯示名稱 (例: 購買問題)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const emojiInput = new TextInputBuilder()
      .setCustomId('emojiInput')
      .setLabel('按鈕 Emoji (例: 🛒)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const prefixInput = new TextInputBuilder()
      .setCustomId('prefixInput')
      .setLabel('頻道前綴 (頻道名稱，例: 購買)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const welcomeInput = new TextInputBuilder()
      .setCustomId('welcomeInput')
      .setLabel('歡迎訊息')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(codeInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(labelInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(emojiInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(prefixInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(welcomeInput),
    );

    // 顯示表單給使用者填寫
    await interaction.showModal(modal);
  }
};

export const removeTicketCategoryCommand = {
  data: new SlashCommandBuilder()
    .setName('remove_ticket_category')
    .setDescription('刪除客服單分類 (管理員專用)')
    .addStringOption(option => 
      option.setName('code')
        .setDescription('要刪除的內部代號')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const code = interaction.options.getString('code');
    await interaction.deferReply({ flags: ['Ephemeral'] });

    try {
      await prisma.ticketCategory.delete({
        where: { code: code! }
      });
      await interaction.editReply(`✅ 已成功刪除客服分類：${code}`);
    } catch (error) {
      console.error('Error removing category:', error);
      await interaction.editReply(`❌ 刪除失敗，可能是找不到代號為 \`${code}\` 的分類。`);
    }
  }
};
