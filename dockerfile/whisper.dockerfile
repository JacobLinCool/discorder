FROM node:lts

WORKDIR /app

# install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/* && apt-get clean

RUN npm i -g --strict-peer-deps whisper-cli

RUN whisper smart model dl medium

CMD ["whisper", "smart", "server", "-m", "medium", "-p", "38080"]
