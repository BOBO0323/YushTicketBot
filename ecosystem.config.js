module.exports = {
  apps: [
    {
      name: 'ticket-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      cwd: 'd:\\YushTicketBot',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'ticket-bot',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'src/bot/index.ts',
      cwd: 'd:\\YushTicketBot',
    }
  ],
};
