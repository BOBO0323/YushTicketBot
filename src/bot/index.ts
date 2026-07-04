import 'dotenv/config';
import http from 'http';
import { 
  Client, GatewayIntentBits, REST, Routes, 
  ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
  ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, TextChannel, EmbedBuilder, AttachmentBuilder
} from 'discord.js';
import * as discordTranscripts from 'discord-html-transcripts';
import { stockCommandData, kucunCommandData, executeStockCommand } from './commands/stock';
import { setupTicketCommand } from './commands/ticket';
import { addTicketCategoryCommand, removeTicketCategoryCommand } from './commands/ticket-settings';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function packAndCloseTicket(channel: TextChannel, closedBy: string, reason: string) {
  try {
    const ticket = await prisma.ticket.findUnique({ where: { channelId: channel.id } });
    const ownerId = ticket?.ownerId || channel.name.split('-').pop(); // Fallback to channel name if DB record is missing

    const panel = await prisma.ticketPanel.findUnique({ where: { id: 1 } });
    const attachment = await discordTranscripts.createTranscript(channel, {
      limit: -1, returnType: discordTranscripts.ExportReturnType.Attachment,
      filename: `${channel.name}-transcript.html`, saveImages: true, poweredBy: false
    });

    const embed = new EmbedBuilder()
      .setTitle('📑 客服單對話紀錄 (Ticket Log)')
      .setColor(0x2B2D31)
      .addFields(
        { name: '頻道名稱', value: channel.name, inline: true },
        { name: '關閉者', value: closedBy, inline: true },
        { name: '原因', value: reason, inline: true }
      )
      .setTimestamp();

    // 1. 發送到 Log Channel
    if (panel?.logChannelId) {
      const logChannel = await channel.client.channels.fetch(panel.logChannelId).catch(()=>null);
      if (logChannel && logChannel.isTextBased()) {
        const msg = await (logChannel as TextChannel).send({ embeds: [embed], files: [attachment] });
        const fileUrl = msg.attachments.first()?.url;
        if (fileUrl) {
          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel('📥 下載對話紀錄 (請用電腦瀏覽器開啟)')
              .setStyle(ButtonStyle.Link)
              .setURL(fileUrl)
          );
          await msg.edit({ components: [row] });
        }
      }
    }

    // 2. 私訊給開單的使用者
    if (ownerId) {
      const user = await channel.client.users.fetch(ownerId).catch(()=>null);
      if (user) {
        const dmEmbed = new EmbedBuilder()
          .setTitle('📑 您的客服單已關閉')
          .setDescription('感謝您的聯繫！這是您本次客服單的完整對話紀錄備份，請下載附檔後使用電腦瀏覽器開啟。')
          .setColor(0x5865F2);
        await user.send({ embeds: [dmEmbed], files: [attachment] }).catch(()=>null);
      }
    }

  } catch (error) { console.error('Pack error:', error); }
  
  await prisma.ticket.deleteMany({ where: { channelId: channel.id } });
  await channel.delete(reason).catch(()=>null);
}

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token) {
  console.error("DISCORD_BOT_TOKEN is not defined in environment variables.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const commands = [
  stockCommandData.toJSON(),
  kucunCommandData.toJSON(),
  setupTicketCommand.data.toJSON(),
  addTicketCategoryCommand.data.toJSON(),
  removeTicketCategoryCommand.data.toJSON(),
];

const rest = new REST({ version: '10' }).setToken(token);

client.once('ready', async () => {
  console.log(`Bot logged in as ${client.user?.tag}`);
  if (clientId) {
    try {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error('Error refreshing commands:', error);
    }
  }

  // Auto-close cron job (runs every 10 minutes)
  setInterval(async () => {
    try {
      const panel = await prisma.ticketPanel.findUnique({ where: { id: 1 } });
      const autoCloseHours = panel?.autoCloseHours || 24;
      const cutoffDate = new Date(Date.now() - autoCloseHours * 60 * 60 * 1000);

      const expiredTickets = await prisma.ticket.findMany({
        where: { status: 'OPEN', lastMessageAt: { lt: cutoffDate } }
      });

      for (const t of expiredTickets) {
        const channel = await client.channels.fetch(t.channelId).catch(()=>null);
        if (channel && channel.isTextBased()) {
          await packAndCloseTicket(channel as TextChannel, '系統 (System)', `超過 ${autoCloseHours} 小時未回覆自動關閉`);
        } else {
          await prisma.ticket.deleteMany({ where: { id: t.id } });
        }
      }
    } catch (error) { console.error('Cron job error:', error); }
  }, 10 * 60 * 1000);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  try {
    const ticket = await prisma.ticket.findUnique({ where: { channelId: message.channel.id } });
    if (ticket && ticket.status === 'OPEN') {
      await prisma.ticket.update({ where: { channelId: message.channel.id }, data: { lastMessageAt: new Date() } });
    }
  } catch (e) {}
});

client.on('interactionCreate', async interaction => {
  // --- 處理指令 ---
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'stock' || interaction.commandName === '庫存') {
      await executeStockCommand(interaction);
    } else if (interaction.commandName === 'setup_ticket') {
      await setupTicketCommand.execute(interaction);
    } else if (interaction.commandName === 'add_ticket_category') {
      await addTicketCategoryCommand.execute(interaction);
    } else if (interaction.commandName === 'remove_ticket_category') {
      await removeTicketCategoryCommand.execute(interaction);
    }
  } 
  
  // --- 處理表單 (Modal) 提交 ---
  else if (interaction.isModalSubmit()) {
    if (interaction.customId === 'add_ticket_category_modal') {
      // (保留原本的邏輯)
      const code = interaction.fields.getTextInputValue('codeInput');
      const label = interaction.fields.getTextInputValue('labelInput');
      const emoji = interaction.fields.getTextInputValue('emojiInput');
      const prefix = interaction.fields.getTextInputValue('prefixInput');
      const welcome = interaction.fields.getTextInputValue('welcomeInput');

      await interaction.deferReply({ flags: ['Ephemeral'] });

      try {
        await prisma.ticketCategory.create({
          data: { code, label, emoji, channelPrefix: prefix, welcomeMessage: welcome }
        });
        await interaction.editReply(`✅ 成功新增客服分類：**${label}**\n請重新執行 \`/setup_ticket\` 更新面板。`);
      } catch (error) {
        console.error('Error saving ticket category:', error);
        await interaction.editReply('❌ 新增失敗！請確認「內部代號」沒有重複。');
      }
    }
  }

  // --- 處理庫存下拉選單 ---
  else if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'select_category') {
      await interaction.deferUpdate();
      const categoryId = interaction.values[0];
      try {
        const subCategories = await prisma.subCategory.findMany({ where: { categoryId } });
        if (subCategories.length === 0) return interaction.editReply({ content: '沒有子類別', components: [] }).then();
        const selectMenu = new StringSelectMenuBuilder().setCustomId('select_subcategory').setPlaceholder('選擇子類別...').addOptions(subCategories.map(s => new StringSelectMenuOptionBuilder().setLabel(s.name).setValue(s.id)));
        await interaction.editReply({ content: '**📦 庫存查詢**', components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)] });
      } catch(e) {}
    } else if (interaction.customId === 'select_subcategory') {
      await interaction.deferUpdate();
      const subCategoryId = interaction.values[0];
      try {
        const products = await prisma.product.findMany({ where: { subCategoryId, isDeleted: false }, include: { variants: { include: { _count: { select: { inventory: { where: { status: 'AVAILABLE' } } } } } } } });
        if (products.length === 0) return interaction.editReply({ content: '無商品', components: [] }).then();
        let res = '**📦 商品庫存**\n\n';
        for (const p of products) {
          const emoji = p.cheatStatus === 'SAFE' ? '🟢' : p.cheatStatus === 'UPDATING' ? '🟡' : '🔴';
          res += `${emoji} **${p.name}**\n`;
          if (p.variants.length === 0) res += `  └ 無卡種\n`;
          else for (const v of p.variants) res += `  └ ${v.name}: **${v._count.inventory}** 張\n`;
          res += '\n';
        }
        await interaction.editReply({ content: res, components: [] });
      } catch(e) {}
    } else if (interaction.customId === 'ticket_select') {
      const selectedValue = interaction.values[0];
      if (selectedValue.startsWith('create_ticket_')) {
        const catCode = selectedValue.replace('create_ticket_', '');
        const category = await prisma.ticketCategory.findUnique({ where: { code: catCode } });
        if (!category || !interaction.guild) return;

        await interaction.deferReply({ flags: ['Ephemeral'] });

        try {
          const newChannel = await interaction.guild.channels.create({
            name: `${category.channelPrefix}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
              { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
              { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
              { id: client.user!.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
            ],
          });

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId(`close_ticket_${interaction.user.id}`).setLabel('🔒 關閉').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('claim_ticket').setLabel('🙋‍♂️ 認領').setStyle(ButtonStyle.Success)
          );

          let pingText = `<@${interaction.user.id}>`;
          if (category.supportRoleId) pingText += ` <@&${category.supportRoleId}>`;

          const embed = new EmbedBuilder()
            .setTitle(`${category.emoji} ${category.label}`)
            .setDescription(category.welcomeMessage)
            .setColor(category.embedColor ? parseInt(category.embedColor.replace('#', ''), 16) : 0x5865F2);
          
          if (category.imageUrl) embed.setImage(category.imageUrl);
          if (category.thumbnailUrl) embed.setThumbnail(category.thumbnailUrl);

          await (newChannel as TextChannel).send({ content: pingText, embeds: [embed], components: [row] });
          await prisma.ticket.create({ data: { channelId: newChannel.id, ownerId: interaction.user.id } });
          await interaction.editReply(`✅ 您的客服單已建立：<#${newChannel.id}>`);
        } catch (error) {
          console.error(error);
          await interaction.editReply('❌ 建立客服單失敗。');
        }
      }
    }
  }

  // --- 處理按鈕互動 (VIP 客服單生命週期) ---
  else if (interaction.isButton()) {
    // 2. 認領客服單
    if (interaction.customId === 'claim_ticket') {
      const channel = interaction.channel as TextChannel;
      if (!channel) return;
      await interaction.reply({ content: `✅ 本客服單已由 <@${interaction.user.id}> 認領處理！` });
      
      // 更新按鈕 (拿掉認領按鈕)
      const msg = await channel.messages.fetch(interaction.message.id);
      const closeBtn = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId((msg.components[0] as any).components[0].customId as string).setLabel('🔒 關閉').setStyle(ButtonStyle.Danger)
      );
      await msg.edit({ components: [closeBtn] });
    }

    // 3. 關閉客服單 (不直接刪除，而是隱藏頻道並提供進階選項)
    else if (interaction.customId.startsWith('close_ticket_')) {
      const channel = interaction.channel as TextChannel;
      if (!channel) return;
      
      const ticketOwnerId = interaction.customId.replace('close_ticket_', '');
      await interaction.deferReply();

      try {
        // 移除原作者權限
        await channel.permissionOverwrites.edit(ticketOwnerId, { ViewChannel: false });
        // 修改頻道名稱
        await channel.setName(`closed-${channel.name.split('-')[1] || ticketOwnerId}`);

        const embed = new EmbedBuilder()
          .setTitle('🔒 客服單已關閉')
          .setDescription(`被 <@${interaction.user.id}> 關閉。\n\n請選擇後續處理方式：`)
          .setColor(0xED4245);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId(`reopen_ticket_${ticketOwnerId}`).setLabel('🔓 重新開啟').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('transcript_ticket').setLabel('📑 儲存紀錄').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('delete_ticket').setLabel('🗑️ 徹底刪除').setStyle(ButtonStyle.Danger)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
      } catch (error) {
        console.error(error);
        await interaction.editReply('❌ 關閉客服單時發生錯誤。');
      }
    }

    // 4. 重新開啟客服單
    else if (interaction.customId.startsWith('reopen_ticket_')) {
      const channel = interaction.channel as TextChannel;
      if (!channel) return;

      const ticketOwnerId = interaction.customId.replace('reopen_ticket_', '');
      await interaction.deferReply();

      try {
        await channel.permissionOverwrites.edit(ticketOwnerId, { ViewChannel: true });
        await channel.setName(`reopened-${ticketOwnerId}`);
        await interaction.editReply(`🔓 客服單已由 <@${interaction.user.id}> 重新開啟。`);
        
        // Disable the admin panel buttons
        await interaction.message.edit({ components: [] });
      } catch (error) {
        console.error(error);
      }
    }

    // 5. 儲存對話紀錄 (HTML Transcript)
    else if (interaction.customId === 'transcript_ticket') {
      const channel = interaction.channel as TextChannel;
      if (!channel) return;

      await interaction.deferReply();
      try {
        const attachment = await discordTranscripts.createTranscript(channel, {
          limit: -1, 
          returnType: discordTranscripts.ExportReturnType.Attachment,
          filename: `${channel.name}-transcript.html`,
          saveImages: true,
          poweredBy: false
        });
        await interaction.editReply({ content: '📑 這是該客服單的完整對話紀錄：', files: [attachment] });
      } catch (error) {
        console.error(error);
        await interaction.editReply('❌ 產生紀錄失敗。');
      }
    }

    // 6. 徹底刪除
    else if (interaction.customId === 'delete_ticket') {
      const channel = interaction.channel as TextChannel;
      if (!channel) return;
      await interaction.reply('🗑️ 頻道即將打包並徹底刪除...');
      await packAndCloseTicket(channel, `<@${interaction.user.id}>`, '管理員手動刪除');
    }
  }
});

client.login(token);

// --- 建立微型 HTTP 伺服器防休眠 (Render 專用) ---
const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is perfectly alive and ready!');
});
server.listen(PORT, () => {
  console.log(`Keep-alive server is listening on port ${PORT}`);
});
