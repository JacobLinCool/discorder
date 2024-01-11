<div align="center">

# discorder

<img src="./images/icon-rounded.png" width="240" height="240">

Discord Recorder.

</div>

## Features

- Recorder for Discord voice channels
- Transcribe to text file
- Live transcription to text channel

## Usage

1. Configure `.env` file
2. `pnpm install` to install dependencies
3. `pnpm register` to register slash commands (only needed once at first run)
4. `pnpm start` to start the bot

### Docker Usage

1. Configure `.env` file
2. `docker compose up -d` to start the bot

## Configuration

You'll need a [Smart Whisper](https://github.com/JacobLinCool/smart-whisper) server to use the transcription feature. You can run it with [whisper-cli](https://github.com/JacobLinCool/whisper-cli):

```sh
pnpm i -g whisper-cli
whisper smart model dl medium
whisper smart server -p 38080 -m medium
```

Then the server will be available at `http://localhost:38080`.

<!-- https://discord.com/api/oauth2/authorize?client_id=1190714041727987712&permissions=36700160&scope=applications.commands+bot -->
