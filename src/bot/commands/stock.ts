import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder 
} from 'discord.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// The common execute function for both /stock and /庫存
export async function executeStockCommand(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: ['Ephemeral'] });
  
  try {
    // 1. 查詢所有 Category
    const categories = await prisma.category.findMany();

    if (categories.length === 0) {
      await interaction.editReply('目前沒有任何商品庫存可以查詢。');
      return;
    }

    // 2. 建立主類別下拉選單
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_category')
      .setPlaceholder('請選擇主類別...')
      .addOptions(
        categories.map(cat => 
          new StringSelectMenuOptionBuilder()
            .setLabel(cat.name)
            .setValue(cat.id)
        )
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.editReply({
      content: '**📦 庫存查詢系統**\n請從下方選擇您想查詢的【主類別】：',
      components: [row]
    });

  } catch (error) {
    console.error('Error in stock command:', error);
    await interaction.editReply('查詢時發生錯誤，請稍後再試。');
  }
}

// Export the command builders
export const stockCommandData = new SlashCommandBuilder()
  .setName('stock')
  .setDescription('Check product inventory / 查詢商品庫存');

export const kucunCommandData = new SlashCommandBuilder()
  .setName('庫存')
  .setDescription('查詢商品庫存 / Check product inventory');
