// PCL CE 联机公告服务器（Cloudflare Worker）
//
// 部署后把根地址填到 PCL.Core/App/Secrets.cs 的 DefaultLinkServerRoot，
// 或者在构建时设置 PCL_LINK_SERVER_ROOT。
//
// 客户端会请求：
//   GET {root}/api/link/v2/cache.ini
//   GET {root}/api/link/v2/announce.json

// 修改公告内容（尤其是 relays）时把这个数字加一，客户端才会重新拉取。
const CACHE_VERSION = 2;

const RELAYS = [
  // official 会映射为“自有节点”，其它值映射为“社区节点”。
  // 新流程不区分类型，都会作为 EasyTier 的 -p 参数使用。
  { name: "Terracotta Relay", url: "https://terracotta.glavo.site/acebc7d8-1208-47fd-b212-d03ac49e36e0", type: "official" },
  { name: "Zkitefly", url: "tcp://183.66.27.22:39409", type: "official" },
  { name: "EasyTier Public", url: "tcp://public.easytier.top:11010", type: "community" },
  { name: "EasyTier CN", url: "tcp://public2.easytier.cn:54321", type: "community" },
  { name: "Zkitefly Node1", url: "https://etnode.zkitefly.eu.org/node1", type: "community" }
];

const ANNOUNCE = {
  // 联机功能是否可用
  available: true,
  // 允许使用自定义用户名（不登录 NAID 时建议为 true）
  allowCustomName: true,
  // 不强制 NAID 登录；设为 false 后也不需要 TELEMETRY_KEY
  requireLogin: false,
  // 不要求实名
  requireRealname: false,
  // 客户端当前支持到 6，填 1 即可
  version: 1,
  // 公告列表，没有就留空数组
  notices: [],
  // EasyTier 公共节点
  relays: RELAYS
};

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*"
};

const TEXT_HEADERS = {
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*"
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    // 兼容 /api/... 和 //api/...，避免根地址多写一个斜杠就 404。
    const path = url.pathname.replace(/^\/+/, "/");

    // 使用 endsWith 兼容两种情况：
    //   1. 根地址是子域名：https://link.example.com
    //   2. 根地址带路径前缀：https://example.com/pcl-link
    if (path.endsWith("/api/link/v2/cache.ini")) {
      return new Response(String(CACHE_VERSION), {
        status: 200,
        headers: TEXT_HEADERS
      });
    }

    if (path.endsWith("/api/link/v2/announce.json")) {
      return new Response(JSON.stringify(ANNOUNCE), {
        status: 200,
        headers: JSON_HEADERS
      });
    }

    if (path === "/") {
      return new Response(
        JSON.stringify({
          service: "PCL CE link announce server",
          cacheVersion: CACHE_VERSION,
          endpoints: ["/api/link/v2/cache.ini", "/api/link/v2/announce.json"]
        }),
        { status: 200, headers: JSON_HEADERS }
      );
    }

    return new Response("Not Found", { status: 404, headers: TEXT_HEADERS });
  }
};
