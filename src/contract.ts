/**
 * 业务契约（Zod schema + 推导类型）
 * 由原 monorepo 的 packages/shared 复制而来，涵盖用户、通用 API、埋点三部分。
 * 前后端各自持有一份；如需同步，请同时更新两端对应文件。
 */
import { z } from 'zod';

/**
 * 用户领域契约：角色、用户资料与注册/登录/资料更新的输入 schema。
 *
 * 这些 schema 是本项目的契约源：server 用来校验请求与约束响应，web 用来推导类型。
 * 角色仅区分 `user` / `admin`，权限的最终裁决永远在后端。
 */


/** 用户角色枚举：默认 user，管理员由 ADMIN_USER_IDS 或 admin 插件授予 */
export const userRoleSchema = z.enum(['user', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * 对外暴露的用户信息：不含密码哈希等敏感字段。
 * email/role 由服务端填充，客户端不可伪造。
 */
export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  email: z.email(),
  role: userRoleSchema,
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;

/** 注册请求：昵称 2~100，邮箱合法，密码 8~128（存储由服务端哈希） */
export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(8).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/** 登录请求：邮箱 + 非空密码，密码长度校验交给注册环节以避免泄露策略细节 */
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** 用户档案（扩展资料）：与用户基础信息分离，按 userId 关联 */
export const profileSchema = z.object({
  userId: z.string(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Profile = z.infer<typeof profileSchema>;

/** 更新用户资料（昵称、头像） */
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).nullable().optional(),
  avatarUrl: z.url().nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * 通用 API 契约（前后端共享的 Zod schema 与推导类型）。
 *
 * 这里定义的是跨模块复用的基础结构：错误响应、分页、ID 参数，以及待办（Todo）的
 * 输入/输出形状。server 用它们校验入参与约束响应，web 用同一份规则做表单校验，
 * 从而避免两端字段约定漂移。修改本文件后必须执行 `pnpm api:generate` 重新生成
 * OpenAPI 文档与前端类型。
 */


/** 统一错误响应结构：所有非 2xx 响应都遵循此形状，requestId 与日志关联 */
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
  requestId: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/** 分页查询参数 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

/** 分页响应封装 */
export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
  });
}

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** 通用 ID 路径参数：用于 `/api/v1/.../:id` 一类路由的入参校验 */
export const idParamSchema = z.object({ id: z.string().min(1) });

/** 待办事项：单个 Todo 的完整输出形状，时间戳为 ISO 8601 字符串 */
export const todoSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  completed: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Todo = z.infer<typeof todoSchema>;

/** 创建待办的输入：仅需标题，长度 1~200 */
export const createTodoSchema = z.object({
  title: z.string().min(1).max(200),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;

/** 更新待办的输入：标题与完成状态均可选，但至少应传一项（由调用方保证） */
export const updateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  completed: z.boolean().optional(),
});

export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

/**
 * 埋点事件契约：前后端共用的 Zod schema。
 *
 * 前端按此形状构造事件并批量上报，后端接收端用同一份 schema 校验。
 * 隐私约定：只采集页面路径（不含 query）、匿名 sessionId 与标量属性；
 * userId 由后端在已登录时从会话补全，前端不得伪造。
 */


/** 埋点事件的基础类型：所有事件都带会话/页面上下文，由前端自动补齐 */
export const telemetryEventSchema = z.object({
  /** 事件类型，建议 `模块_动作`，如 page_view / todo_create / api_error */
  type: z.string().min(1).max(100),
  /** 事件发生时间（ISO 8601） */
  timestamp: z.string().datetime(),
  /** 页面路径（不含 query，避免敏感参数入日志） */
  path: z.string().max(500),
  /** 匿名会话 ID（浏览器本地生成，不含用户身份） */
  sessionId: z.string().min(1).max(100),
  /** 用户 ID（已登录时由后端从 session 补全，前端不传） */
  userId: z.string().optional(),
  /** 事件属性：键值对，值限定为可序列化标量 */
  props: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export type TelemetryEvent = z.infer<typeof telemetryEventSchema>;

/** 批量上报请求体：一次最多 100 条，与前端 MAX_BATCH 保持一致 */
export const telemetryBatchSchema = z.object({
  events: z.array(telemetryEventSchema).min(1).max(100),
});

export type TelemetryBatch = z.infer<typeof telemetryBatchSchema>;
