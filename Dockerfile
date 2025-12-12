FROM public.ecr.aws/lambda/nodejs:20 AS builder

RUN npm install -g pnpm

WORKDIR /build

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src/ ./src/

RUN pnpm run build

FROM public.ecr.aws/lambda/nodejs:20 AS production

RUN npm install -g pnpm

WORKDIR ${LAMBDA_TASK_ROOT}

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /build/dist/ ./dist/

CMD ["dist/handler.handler"]

