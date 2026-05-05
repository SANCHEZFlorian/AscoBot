import { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';
import { captchaCache } from '../utils/captchaManager.js';
import pool from '../utils/db.js';
import pkg from 'canvas';
const { createCanvas, loadImage } = pkg;

export const event = {
    name: 'guildMemberAdd',
    once: false,
    async execute(member) {
        const logChannelId = getLogChannelId(member.guild.id, 'arrivees-departs');
        if (!logChannelId) return;

        try {
            const channel = await member.client.channels.fetch(logChannelId);
            if (!channel) return;

            // --- Génération de l'image de bloc de bienvenue ---
            const canvas = createCanvas(700, 250);
            const ctx = canvas.getContext('2d');

            // Fond
            ctx.fillStyle = '#1e2124';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Ligne de décoration verticale
            ctx.fillStyle = '#3498db';
            ctx.fillRect(0, 0, 15, canvas.height);

            // Textes
            ctx.font = '32px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('Bienvenue sur le serveur,', 220, 100);

            ctx.font = 'bold 45px sans-serif';
            ctx.fillStyle = '#3498db';
            let nameText = member.user.username;
            if (nameText.length > 15) nameText = nameText.substring(0, 15) + '...';
            ctx.fillText(nameText, 220, 160);

            ctx.font = '24px sans-serif';
            ctx.fillStyle = '#7f8c8d';
            ctx.fillText(`Tu es notre membre n°${member.guild.memberCount}`, 220, 200);

            // Avatar rond
            ctx.beginPath();
            ctx.arc(110, 125, 75, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();

            try {
                // Fetch avatar as PNG strictly
                const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
                const avatar = await loadImage(avatarUrl);
                ctx.drawImage(avatar, 35, 50, 150, 150);
            } catch(e) {
                console.error("Erreur de chargement avatar canvas :", e);
            }

            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome-image.png' });
            
            const embed = new EmbedBuilder()
                .setTitle('🟢 Arrivée')
                .setColor('#2ECC71')
                .setDescription(`<@${member.user.id}> nous a rejoint !`)
                .setImage('attachment://welcome-image.png')
                .setTimestamp();

            await channel.send({ embeds: [embed], files: [attachment] });

            // --- DEBUT SYSTÈME DE CAPTCHA ---
            // Vérifier si le captcha est configuré sur ce serveur
            let captchaRoleId = null;
            try {
                const conn = await pool.getConnection();
                const [rows] = await conn.query('SELECT captcha_role_id FROM server_config WHERE guild_id = ?', [member.guild.id]);
                if (rows.length > 0) captchaRoleId = rows[0].captcha_role_id;
                conn.release();
            } catch (e) { console.error(e); }

            if (captchaRoleId) {
                // Génération du code
                const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                let code = '';
                for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));

                // Sauvegarde en cache
                captchaCache.set(member.user.id, { code: code, attempts: 0, guildId: member.guild.id, roleId: captchaRoleId });

                // Génération image Canvas
                const captchaCanvas = createCanvas(300, 100);
                const ctx = captchaCanvas.getContext('2d');

                // Fond
                ctx.fillStyle = '#2C3E50';
                ctx.fillRect(0, 0, 300, 100);

                // Lignes de bruit
                for (let i = 0; i < 7; i++) {
                    ctx.strokeStyle = ['#E74C3C', '#E67E22', '#F1C40F', '#2ECC71', '#3498DB'][Math.floor(Math.random() * 5)];
                    ctx.beginPath();
                    ctx.moveTo(Math.random() * 300, Math.random() * 100);
                    ctx.lineTo(Math.random() * 300, Math.random() * 100);
                    ctx.lineWidth = Math.random() * 3 + 1;
                    ctx.stroke();
                }

                // Texte
                ctx.font = 'bold 50px Courier New';
                ctx.fillStyle = '#FFFFFF';
                // Tremblement léger des lettres
                for (let i = 0; i < 6; i++) {
                    ctx.save();
                    ctx.translate(20 + (i * 45), 65);
                    ctx.rotate((Math.random() - 0.5) * 0.4);
                    ctx.fillText(code[i], 0, 0);
                    ctx.restore();
                }

                const capAtt = new AttachmentBuilder(captchaCanvas.toBuffer(), { name: 'captcha.png' });
                
                const capEmbed = new EmbedBuilder()
                    .setTitle('🔒 Vérification Anti-Robot')
                    .setColor('#E74C3C')
                    .setDescription(`Bienvenue sur **${member.guild.name}** !\nPour accéder au serveur, vous devez prouver que vous êtes humain.\n\nCliquez sur le bouton ci-dessous pour entrer le code de l'image.\n*⚠️ Vous avez 3 essais avant d'être expulsé.*`)
                    .setImage('attachment://captcha.png');

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('btn_captcha_solve').setLabel('Saisir le Code').setStyle(ButtonStyle.Primary)
                );

                try {
                    await member.user.send({ embeds: [capEmbed], files: [capAtt], components: [row] });
                } catch (e) {
                    console.error("Impossible d'envoyer le MP de Captcha au membre:", member.user.tag);
                }
            }
            // --- FIN SYSTÈME DE CAPTCHA ---

        } catch (error) {}
    },
};
