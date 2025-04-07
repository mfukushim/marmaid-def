/*! map-space-mcp | MIT License | https://github.com/mfukushim/map-space-mcp */

import {HttpApi, HttpApiEndpoint, HttpApiGroup} from "@effect/platform"
import {Schema} from "effect"

export type Vec3 = [number, number, number];
export type Point = [number, number];


export class GenericError extends Schema.TaggedError<GenericError>()("GenericError", {
  mes: Schema.String
}) {
}

const LocStatusSchema = Schema.Literal(
  'error',
  'exist',
  'notFound',
)
const MoveStatusSchema = Schema.Literal(
  'error',
  'moved',
  'notMoved',
  'notFound',
)
const AddRemoveStatusSchema = Schema.Literal(
  'error',
  'added',
  'removed',
  'changed',
  'notAdded',
  'notRemoved',
  'notFound',
)

export type LocStatus = typeof LocStatusSchema.Type
export type MoveStatus = typeof MoveStatusSchema.Type
export type AddRemoveStatus = typeof AddRemoveStatusSchema.Type

/**
 * 機能/意味主体情報
 */
export class FeatureInfoSchema extends Schema.Class<FeatureInfoSchema>("FeatureInfoSchema")({
  id: Schema.String,
  description: Schema.String,
  dist: Schema.Number,
  radius: Schema.Number,
}) {
}

/**
 * 機能/意味/座標情報
 */
export class EntityInfoSchema extends Schema.Class<EntityInfoSchema>("EntityInfoSchema")({
  id: Schema.String,
  parentRegionId: Schema.UndefinedOr(Schema.String),
  description: Schema.String,
  location: Schema.UndefinedOr(Schema.Struct({
    lat: Schema.Number,
    lng: Schema.Number,
  })),
  offset: Schema.UndefinedOr(Schema.Struct({
    x: Schema.Number,
    y: Schema.Number,
  })),
  radius: Schema.UndefinedOr(Schema.Number),
  frontAngle: Schema.UndefinedOr(Schema.Number),
}) {
}


export class ViewApiGroup extends HttpApiGroup.make("view")
  .add(HttpApiEndpoint.get("viewPrompt", "/view-prompt")
    .addSuccess(Schema.Struct({
        status: Schema.NonEmptyTrimmedString,
        prompt: Schema.String,
      }
    ))
    .addError(GenericError, {status: 500})
    .setUrlParams(Schema.Struct({
      userId: Schema.NonEmptyTrimmedString,
      lat: Schema.NumberFromString,
      lng: Schema.NumberFromString,
      bearing: Schema.NumberFromString
    }))
  )
  .add(HttpApiEndpoint.get("testPoint", "/test-point")  //  デバッグ用
    .addSuccess(Schema.Struct({
        status: Schema.NonEmptyTrimmedString,
        entities: Schema.Array(EntityInfoSchema),
      }
    ))
    .addError(GenericError, {status: 500})
    .setUrlParams(Schema.Struct({
      userId: Schema.NonEmptyTrimmedString,
      lat: Schema.NumberFromString,
      lng: Schema.NumberFromString,
      bearing: Schema.NumberFromString,
      radius: Schema.NumberFromString,
    }))
  )
  .add(HttpApiEndpoint.get("viewInfo", "/view-info")  //  視覚情報
    .addSuccess(Schema.Struct({
        status: Schema.NonEmptyTrimmedString,
        enclosingEntities: Schema.Array(FeatureInfoSchema),
        visibleEntities: Schema.Array(FeatureInfoSchema),
      }
    ))
    .addError(GenericError, {status: 500})
    .setUrlParams(Schema.Struct({
      userId: Schema.NonEmptyTrimmedString,
      lat: Schema.NumberFromString,
      lng: Schema.NumberFromString,
      bearing: Schema.NumberFromString
    }).annotations({examples:[{userId:"1",lat:30,lng:130,bearing:0}]}))
  )
  .add(HttpApiEndpoint.get("regionMap", "/region-map")  //  移動/操作可能範囲マップ
    .addSuccess(Schema.Struct({
        status: Schema.NonEmptyTrimmedString,
        lat: Schema.Number,
        lng: Schema.Number,
        bearing: Schema.Number,
        regionDesc: Schema.String,
        excludeEntities: Schema.Array(FeatureInfoSchema),  //  移動可能
        reachableEntities: Schema.Array(FeatureInfoSchema), //  触る/追加/削除/変化可能
      }
    ))
    .addError(GenericError, {status: 500})
    .setUrlParams(Schema.Struct({
      userId: Schema.NonEmptyTrimmedString,
      lat: Schema.NumberFromString,
      lng: Schema.NumberFromString,
      bearing: Schema.NumberFromString
    }).annotations({examples:[{userId:"1",lat:30,lng:130,bearing:0}]}))
  )
  .add(HttpApiEndpoint.post("checkTarget", "/check-target") //  存在確認ユーティリティ
    .addSuccess(Schema.Struct({
        status: LocStatusSchema,
        answer: Schema.String, // is
        // targetName: Schema.UndefinedOr(Schema.String),
        targetId: Schema.UndefinedOr(Schema.String),
      }
    ))
    .addError(GenericError, {status: 500})
    .setPayload(Schema.Struct({
      userId: Schema.String,
      target: Schema.String,
      // targets: Schema.Array(Schema.NonEmptyTrimmedString),
      lat: Schema.Number,
      lng: Schema.Number,
      bearing: Schema.Number
    }).annotations({examples:[{userId:"1",target:"living",lat:30,lng:130,bearing:0}]}))
  )
  .add(HttpApiEndpoint.post("moveToTarget", "/move-to-target")  //  移動
    .addSuccess(Schema.Struct({
        status: MoveStatusSchema,
        answer: Schema.String,
        loc: Schema.UndefinedOr(Schema.Struct(
          {
            lat: Schema.Number,
            lng: Schema.Number,
            bearing: Schema.Number,
          }
        ))
      }
    ))
    .addError(GenericError, {status: 500})
    .setPayload(Schema.Struct({
      userId: Schema.NonEmptyTrimmedString,
      lat: Schema.Number,
      lng: Schema.Number,
      bearing: Schema.Number,
      target: Schema.String,
    }).annotations({examples:[{userId:"1",target:"living",lat:30,lng:130,bearing:0}]}))
  )
  .add(HttpApiEndpoint.post("addSignPost", "/add-sign-post")  //  マーカー追加
    .addSuccess(Schema.Struct({
        status: AddRemoveStatusSchema,
        answer: Schema.String,
        loc: Schema.UndefinedOr(Schema.Struct(
          {
            lat: Schema.Number,
            lng: Schema.Number,
            bearing: Schema.Number,
          }
        )),
        entityId: Schema.UndefinedOr(Schema.String),
      }
    ))
    .addError(GenericError, {status: 500})
    .setPayload(Schema.Struct({
      userId: Schema.NonEmptyTrimmedString,
      lat: Schema.Number,
      lng: Schema.Number,
      bearing: Schema.Number,
      description: Schema.NonEmptyTrimmedString,
      radius: Schema.UndefinedOr(Schema.Number),
      addTarget: Schema.UndefinedOr(Schema.String),
      expirationEpoch: Schema.UndefinedOr(Schema.Number),
    }))
  )
  .add(HttpApiEndpoint.post("removeSignPost", "/remove-sign-post")  //  マーカー削除
    .addSuccess(Schema.Struct({
        status: AddRemoveStatusSchema,
        answer: Schema.String,
      }
    ))
    .addError(GenericError, {status: 500})
    .setPayload(Schema.Struct({
      userId: Schema.NonEmptyTrimmedString,
      lat: Schema.Number,
      lng: Schema.Number,
      bearing: Schema.Number,
      target: Schema.String,
    })))
    .add(HttpApiEndpoint.post("updateSignPost", "/update-sign-post")  //  記述の変化、追加削除
      .addSuccess(Schema.Struct({
          status: AddRemoveStatusSchema,
          answer: Schema.String,
        }
      ))
      .addError(GenericError, {status: 500})
      .setPayload(Schema.Struct({
        userId: Schema.NonEmptyTrimmedString,
        lat: Schema.Number,
        lng: Schema.Number,
        bearing: Schema.Number,
        target: Schema.String,
        description: Schema.String,
      }))
  ) {
}

export class MarmaidApi extends HttpApi.make("marmaid")
  .add(ViewApiGroup) {
}
