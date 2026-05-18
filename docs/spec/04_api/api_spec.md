# API Specification — Shopping Memo

**作成日**: 2026-05-09  
**プロジェクト**: Shopping Memo  
**目的**: REST API仕様の定義

---

## 概要

### Base URL
- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://shopping-memo.vercel.app/api/v1`

### 認証方式
- **Type**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`
- **Provider**: Supabase Auth

### レスポンス形式
- **Content-Type**: `application/json`
- **文字コード**: UTF-8

---

## 共通仕様

### 成功レスポンス
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

### エラーレスポンス
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  }
}
```

### HTTPステータスコード
| コード | 意味 | 使用例 |
|--------|------|--------|
| 200 | OK | 成功（GET, PUT, PATCH） |
| 201 | Created | リソース作成成功（POST） |
| 204 | No Content | 削除成功（DELETE） |
| 400 | Bad Request | リクエストパラメータ不正 |
| 401 | Unauthorized | 認証失敗 |
| 403 | Forbidden | 権限不足 |
| 404 | Not Found | リソースが存在しない |
| 409 | Conflict | リソース重複 |
| 422 | Unprocessable Entity | バリデーションエラー |
| 500 | Internal Server Error | サーバーエラー |

---

## 1. 認証API

### 1.1 ユーザー登録

**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "display_name": "Tai HT"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "Tai HT",
      "created_at": "2026-05-09T16:56:31.003Z"
    }
  },
  "message": "Registration successful. Please check your email for verification."
}
```

---

### 1.2 ログイン

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token",
    "expires_in": 3600,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "Tai HT"
    }
  }
}
```

---

## 2. 料理API (Meals)

### 2.1 料理一覧取得

**Endpoint**: `GET /meals`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| category | string | No | - | カテゴリフィルタ（japanese/western/chinese/other） |
| search | string | No | - | 料理名検索 |
| sort | string | No | created_at | ソート |

**Response** (200):
```json
{
  "success": true,
  "data": {
    "meals": [
      {
        "id": "uuid",
        "name": "カレーライス",
        "ingredients": ["じゃがいも", "人参", "玉ねぎ", "豚肉", "カレールー"],
        "category": "japanese",
        "created_at": "2026-05-09T16:56:31.003Z",
        "updated_at": "2026-05-09T16:56:31.003Z"
      }
    ]
  }
}
```

---

### 2.2 料理詳細取得

**Endpoint**: `GET /meals/{meal_id}`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "meal": {
      "id": "uuid",
      "name": "カレーライス",
      "ingredients": ["じゃがいom", "人参", "玉ねぎ", "豚肉", "カレールー"],
      "category": "japanese",
      "created_at": "2026-05-09T16:56:31.003Z",
      "updated_at": "2026-05-09T16:56:31.003Z"
    }
  }
}
```

---

### 2.3 料理登録

**Endpoint**: `POST /meals`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "カレーライス",
  "ingredients": ["じゃがいも", "人参", "玉ねぎ", "豚肉", "カレールー"],
  "category": "japanese"
}
```

**Validation**:
- `name`: 必須、1〜100文字
- `ingredients`: JSONB mảng chuỗi
- `category`: 必須、Enum値

**Response** (201):
```json
{
  "success": true,
  "data": {
    "meal": {
      "id": "uuid",
      "name": "カレーライス",
      "ingredients": ["じゃがいも", "人参", "玉ねぎ", "豚肉", "カレールー"],
      "category": "japanese",
      "created_at": "2026-05-09T16:56:31.003Z",
      "updated_at": "2026-05-09T16:56:31.003Z"
    }
  }
}
```

---

### 2.4 料理更新

**Endpoint**: `PUT /meals/{meal_id}`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "カレーライス（辛口）",
  "ingredients": ["じゃがいも", "人参", "玉ねぎ", "豚肉", "カレールー（辛口）"],
  "category": "japanese"
}
```

---

### 2.5 料理削除

**Endpoint**: `DELETE /meals/{meal_id}`

**Headers**: `Authorization: Bearer <token>`

**Response** (204):
```
No Content
```

---

## 3. 雑貨API (Products)

### 3.1 雑貨一覧取得

**Endpoint**: `GET /products`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "トイレットペーパー",
        "image_url": "http://...",
        "category": "daily",
        "created_at": "2026-05-09T16:56:31.003Z",
        "updated_at": "2026-05-09T16:56:31.003Z"
      }
    ]
  }
}
```

---

### 3.2 雑貨登録

**Endpoint**: `POST /products`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "トイレットペーパー",
  "image_url": "http://...",
  "category": "daily"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "uuid",
      "name": "トイレットペーパー",
      "image_url": "http://...",
      "category": "daily",
      "created_at": "2026-05-09T16:56:31.003Z",
      "updated_at": "2026-05-09T16:56:31.003Z"
    }
  }
}
```

---

### 3.3 雑貨更新

**Endpoint**: `PUT /products/{product_id}`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "トイレットペーパー（12ロール）",
  "image_url": "http://...",
  "category": "daily"
}
```

---

### 3.4 雑貨削除

**Endpoint**: `DELETE /products/{product_id}`

**Headers**: `Authorization: Bearer <token>`

**Response** (204):
```
No Content
```

## 4. 食事計画API

### 4.1 現在の食事計画取得

**Endpoint**: `GET /meal-plans/current`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| week_start | date | No | 来週の月曜日 | 週の開始日（YYYY-MM-DD） |

**Response** (200):
```json
{
  "success": true,
  "data": {
    "meal_plan": {
      "id": "uuid",
      "week_start_date": "2026-05-12",
      "status": "active",
      "meals": [
        {
          "id": "uuid",
          "day_of_week": 0,
          "meal_type": null,
          "dish": {
            "id": "uuid",
            "name": "カレーライス",
            "category": "japanese"
          }
        }
      ],
      "created_at": "2026-05-09T16:56:31.003Z",
      "updated_at": "2026-05-09T16:56:31.003Z"
    }
  }
}
```

**Errors**:
- `401`: Unauthorized
- `404`: Meal plan not found

---

### 4.2 食事計画作成

**Endpoint**: `POST /meal-plans`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "week_start_date": "2026-05-12",
  "meals": [
    {
      "day_of_week": 0,
      "meal_id": "uuid"
    },
    {
      "day_of_week": 1,
      "meal_id": "uuid"
    }
  ]
}
```

**Validation**:
- `week_start_date`: 必須、月曜日の日付
- `meals`: 配列、各要素は以下を含む
  - `day_of_week`: 0〜6（0=月, 6=日）
  - `meal_id`: 存在する料理ID
  - `meal_type`: (Optional) 日ごとの表示順スロット（例: breakfast/lunch/dinner）。同じ日に最大3件登録可能。

**Response** (201):
```json
{
  "success": true,
  "data": {
    "meal_plan": {
      "id": "uuid",
      "week_start_date": "2026-05-12",
      "status": "active",
      "meals": [ ... ],
      "created_at": "2026-05-09T16:56:31.003Z",
      "updated_at": "2026-05-09T16:56:31.003Z"
    }
  },
  "message": "Meal plan created successfully"
}
```

**Errors**:
- `400`: Invalid week_start_date (not Monday)
- `401`: Unauthorized
- `409`: Meal plan already exists for this week
- `422`: Validation error

---

### 4.3 食事計画更新

**Endpoint**: `PUT /meal-plans/{plan_id}`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "meals": [
    {
      "day_of_week": 0,
      "meal_id": "uuid"
    }
  ]
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "meal_plan": {
      "id": "uuid",
      "week_start_date": "2026-05-12",
      "status": "active",
      "meals": [ ... ],
      "created_at": "2026-05-09T16:56:31.003Z",
      "updated_at": "2026-05-09T17:00:00.000Z"
    }
  },
  "message": "Meal plan updated successfully"
}
```

---

### 4.4 食事計画削除

**Endpoint**: `DELETE /meal-plans/{plan_id}`

**Headers**: `Authorization: Bearer <token>`

**Response** (204):
```
No Content
```

---

## 5. 買い物リストAPI

### 5.1 買い物リスト生成 (Generate)

**Endpoint**: `POST /shopping-lists/generate`

**Headers**: `Authorization: Bearer <token>`

**Description**: Xóa danh sách mua sắm cũ của tuần (nếu có) và tạo mới dựa trên Meal Plan hiện tại. Mỗi nguyên liệu của món ăn sẽ là một bản ghi `shopping_item` riêng biệt.

**Request Body**:
```json
{
  "meal_plan_id": "uuid",
  "product_ids": ["uuid1", "uuid2"]
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "shopping_list": {
      "id": "uuid",
      "week_start_date": "2026-05-12",
      "status": "active",
      "items": [
        {
          "id": "uuid",
          "name": "じゃがいも",
          "category": "vegetables",
          "source_type": "meal",
          "source_id": "meal-uuid",
          "note": "Dùng cho món Thịt kho tàu",
          "is_checked": false,
          "created_at": "2026-05-09T16:56:31.003Z"
        }
      ],
      "total_items": 15,
      "checked_items": 0,
      "created_at": "2026-05-09T16:56:31.003Z"
    }
  },
  "message": "Shopping list generated successfully"
}
```

**Errors**:
- `401`: Unauthorized
- `404`: Meal plan not found
- `409`: Shopping list already exists for this week

---

### 5.2 現在の買い物リスト取得

**Endpoint**: `GET /shopping-lists/current`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "shopping_list": {
      "id": "uuid",
      "week_start_date": "2026-05-12",
      "status": "active",
      "items": [ ... ],
      "total_items": 15,
      "checked_items": 5,
      "progress": 33.33,
      "created_at": "2026-05-09T16:56:31.003Z"
    }
  }
}
```

---

### 5.3 アイテムチェック更新

**Endpoint**: `PATCH /shopping-lists/{list_id}/items/{item_id}`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "is_checked": true
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "item": {
      "id": "uuid",
      "name": "じゃがいも",
      "is_checked": true,
      "checked_at": "2026-05-09T17:00:00.000Z"
    }
  },
  "message": "Item checked successfully"
}
```

---

### 5.4 手動アイテム追加

**Endpoint**: `POST /shopping-lists/{list_id}/items`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "牛乳",
  "category": "dairy"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "item": {
      "id": "uuid",
      "name": "牛乳",
      "category": "dairy",
      "source_type": "manual",
      "is_checked": false,
      "created_at": "2026-05-09T17:00:00.000Z"
    }
  },
  "message": "Item added successfully"
}
```

---

### 5.5 買い物リスト完了

**Endpoint**: `POST /shopping-lists/{list_id}/complete`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "shopping_list": {
      "id": "uuid",
      "status": "completed",
      "completed_at": "2026-05-09T17:00:00.000Z"
    }
  },
  "message": "Shopping list completed successfully"
}
```

---

### 5.6 買い物履歴取得（Nice to Have）

**Endpoint**: `GET /shopping-lists/history`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| weeks | integer | No | 2 | 過去何週間分 |

**Response** (200):
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "uuid",
        "week_start_date": "2026-05-05",
        "status": "completed",
        "total_items": 15,
        "checked_items": 15,
        "completed_at": "2026-05-06T10:00:00.000Z"
      }
    ],
    "total": 2
  }
}
```

---

## 6. ダッシュボードAPI

### 6.1 ダッシュボードサマリー取得

**Endpoint**: `GET /dashboard/summary`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "current_week": {
      "meal_plan": {
        "id": "uuid",
        "week_start_date": "2026-05-12",
        "meals_count": 7
      },
      "shopping_list": {
        "id": "uuid",
        "total_items": 15,
        "checked_items": 5,
        "progress": 33.33
      }
    },
    "stats": {
      "total_dishes": 25,
      "total_miscellaneous": 10,
      "completed_shopping_lists": 8
    },
    "recent_activities": [
      {
        "type": "meal_plan_created",
        "timestamp": "2026-05-09T16:56:31.003Z",
        "description": "Created meal plan for week of 2026-05-12"
      }
    ]
  }
}
```

---

## レート制限

| エンドポイント | 制限 |
|---------------|------|
| 認証API | 10 req/min |
| その他API | 100 req/min |

**レート制限超過時のレスポンス** (429):
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retry_after": 60
  }
}
```

---

## 次のステップ

1. **Tracking Log作成** → `05_tracking/decisions.md`
2. **OpenAPI Spec生成** → `04_api/openapi.yaml`
3. **API実装開始** → Backend開発

---

**作成者**: Claude + Tai  
**レビュー日**: 2026-05-09  
**ステータス**: ✅ Draft
