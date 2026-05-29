# Tyrantware Archive API

本文档说明恶意软件档案库查询接口的调用方法。

## 接口地址

```text
GET /api/search
POST /api/search
```

```text
https://tyrantware-archive.example.com/api/search
```

## 请求参数

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `vendor` | string | 是 | 软件厂商名称 |
| `software_name` | string | 是 | 软件名称 |

### `vendor` 可选值

- `微软`
- `苹果`
- `谷歌`
- `Adobe`
- `亚马逊`
- `Meta`
- `惠普`
- `三星`
- `特斯拉`
- `索尼`
- `任天堂`
- `高通`

## GET 调用示例

### curl

```bash
curl "https://your-domain.com/api/search?vendor=微软&software_name=Windows%2011"
```

### JavaScript

```js
const params = new URLSearchParams({
  vendor: '微软',
  software_name: 'Windows 11'
})

const response = await fetch(`https://your-domain.com/api/search?${params}`, {
  headers: { Accept: 'application/json' }
})

const data = await response.json()
console.log(data)
```

## POST 调用示例

### curl

```bash
curl -X POST "https://your-domain.com/api/search" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor": "微软",
    "software_name": "Windows 11"
  }'
```

### JavaScript

```js
const response = await fetch('https://your-domain.com/api/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  body: JSON.stringify({
    vendor: '微软',
    software_name: 'Windows 11'
  })
})

const data = await response.json()
console.log(data)
```

## 成功响应示例

### 已记录在案

```json
{
  "success": true,
  "found": true,
  "query": {
    "vendor": "微软",
    "software_name": "Windows 11"
  },
  "entry": {
    "id": 1,
    "vendor": "微软",
    "software_name": "Windows 11",
    "malware_category": "监视",
    "description": "示例描述",
    "evidence_urls": "https://example.com/source",
    "created_at": "2026-05-26 12:00:00",
    "updated_at": "2026-05-26 12:30:00",
    "images": [
      {
        "id": 10,
        "filename": "evidence.png",
        "mime_type": "image/png",
        "url": "https://your-domain.com/api/public-images/10"
      }
    ]
  }
}
```

### 未收录

```json
{
  "success": true,
  "found": false,
  "query": {
    "vendor": "微软",
    "software_name": "Windows 11"
  },
  "entry": null
}
```

## 失败响应示例

```json
{
  "success": false,
  "error": "软件厂商选项无效。"
}
```

### 常见错误

- `软件名称不能为空。`
- `软件名称只能包含 ASCII 字符。`
- `软件厂商选项无效。`
- `请求过于频繁，请稍后再试。`

## 说明

- 查询接口允许跨域调用
- `GET` 适合普通查询
- `POST` 适合服务端或程序内部封装调用
