import { EmbedBuilder } from 'discord.js';
import { getLogChannelId } from '../utils/logManager.js';

export const event = {
    name: 'guildMemberAdd',
    once: false,
    async execute(member) {
        const logChannelId = getLogChannelId(member.guild.id, 'arrivees-departs');
        if (!logChannelId) return;

        try {
            const channel = await member.client.channels.fetch(logChannelId);
            if (!channel) return;

            const embed = new EmbedBuilder()
                .setTitle('🟢 Nouveau Membre')
                .setColor('#2ECC71')
                .setAuthor({
                    name: `${member.user.tag} (${member.user.id})`,
                    iconURL: member.user.displayAvatarURL({ dynamic: true })
                })
                .setDescription(`<@${member.user.id}> a rejoint le serveur à <t:${Math.floor(Date.now() / 1000)}:T>.`)
                .addFields(
                    { name: 'Création du compte', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>` }
                )
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        } catch (error) {}
    },
};
