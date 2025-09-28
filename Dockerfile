FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS build
RUN pnpm install
RUN pnpm run build

FROM base
COPY --from=build /app /app
EXPOSE 3000
CMD [ "pnpm", "start" ]