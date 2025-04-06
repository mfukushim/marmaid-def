/*! map-space-mcp | MIT License | https://github.com/mfukushim/map-space-mcp */

import {HttpApi, HttpApiEndpoint, HttpApiGroup} from "@effect/platform"
import {Schema} from "effect"
import {MapDef} from "./MapDef.js";

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

// export class ExistenceSchema extends Schema.Class<ExistenceSchema>("ExistenceSchema")({
//   id: Schema.String,
//   // typeName: Schema.String,
//   // uniqueName: Schema.UndefinedOr(Schema.String),
//   parentRegionId: Schema.UndefinedOr(Schema.String),
//   // hasObject: Schema.Boolean,
//   description: Schema.String,
//   dist: Schema.Number,
//   radius: Schema.Number,
//   camPos: CamPosSchema, //  カメラビュー文言相対位置
//   pos2d: Schema.Array(Schema.Number), //  カメラ座標上面2d位置
//   pos3d: Schema.Array(Schema.Number), //  カメラ座標系3d位置
// }) {
// }

export class FeatureInfoSchema extends Schema.Class<FeatureInfoSchema>("FeatureInfoSchema")({
  id: Schema.String,
  // typeName: Schema.String,
  // uniqueName: Schema.UndefinedOr(Schema.String),
  // hasObject: Schema.Boolean,
  description: Schema.String,
  dist: Schema.Number,
  radius: Schema.Number,
  // camPos: CamPosSchema, //  カメラビュー文言相対位置
  // camDist: CamDistSchema, //  カメラビュー文言相対位置
}) {
}


export const EntityInfoSchema = Schema.Struct({
  id: Schema.String,
  // typeName: Schema.String,
  // uniqueName: Schema.UndefinedOr(Schema.String),
  parentRegionId: Schema.UndefinedOr(Schema.String),
  // hasObject: Schema.Boolean,
  description: Schema.String,
  //  locationかoffsetで指定 offsetの場合はparentRegionIdが必須
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
})

export const MarmaidTextSearchSchema = Schema.Struct({
  places: MapDef.GmPlacesSchema,
  // regions: Schema.UndefinedOr(Schema.Array(EntityInfoSchema)),
  objects: Schema.UndefinedOr(Schema.Array(EntityInfoSchema)),
})




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
  // .add(HttpApiEndpoint.get("viewPoint", "/view-point")
  //   .addSuccess(Schema.Struct({
  //       status: Schema.NonEmptyTrimmedString,
  //       points: Schema.Array(ExistenceSchema),
  //     }
  //   ))
  //   .addError(GenericError, {status: 500})
  //   .setUrlParams(Schema.Struct({
  //     userId: Schema.NonEmptyTrimmedString,
  //     lat: Schema.NumberFromString,
  //     lng: Schema.NumberFromString,
  //     bearing: Schema.NumberFromString
  //   }))
  // )
  .add(HttpApiEndpoint.get("testPoint", "/test-point")
    .addSuccess(Schema.Struct({
        status: Schema.NonEmptyTrimmedString,
        // regions: Schema.Array(EntityInfoSchema),
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
  .add(HttpApiEndpoint.get("viewInfo", "/view-info")
    .addSuccess(Schema.Struct({
        status: Schema.NonEmptyTrimmedString,
        enclosingEntities: Schema.Array(FeatureInfoSchema),
        // regions: Schema.Array(FeatureInfoSchema),
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
  .add(HttpApiEndpoint.get("regionMap", "/region-map")
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
  .add(HttpApiEndpoint.post("checkTarget", "/check-target")
    .addSuccess(Schema.Struct({
        status: LocStatusSchema,
        answer: Schema.String,
        targetName: Schema.UndefinedOr(Schema.String),
        targetId: Schema.UndefinedOr(Schema.String),
      }
    ))
    .addError(GenericError, {status: 500})
    .setPayload(Schema.Struct({
      userId: Schema.String,
      targets: Schema.Array(Schema.NonEmptyTrimmedString),
      lat: Schema.Number,
      lng: Schema.Number,
      bearing: Schema.Number
    }).annotations({examples:[{userId:"1",targets:["living"],lat:30,lng:130,bearing:0}]}))
  )
  .add(HttpApiEndpoint.post("moveToTarget", "/move-to-target")
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
      proceed: Schema.Number,
      target: Schema.String,
    }).annotations({examples:[{userId:"1",proceed:1,target:"living",lat:30,lng:130,bearing:0}]}))
  )
  .add(HttpApiEndpoint.post("addObject", "/add-object")
    .addSuccess(Schema.Struct({
        status: AddRemoveStatusSchema,
        answer: Schema.String,
        // loc: Schema.UndefinedOr(Schema.Struct(
        //   {
        //     lat: Schema.Number,
        //     lng: Schema.Number,
        //     bearing: Schema.Number,
        //   }
        // )),
        objectId: Schema.UndefinedOr(Schema.String),
        regionId: Schema.UndefinedOr(Schema.String),
      }
    ))
    .addError(GenericError, {status: 500})
    .setPayload(Schema.Struct({
      userId: Schema.NonEmptyTrimmedString,
      lat: Schema.Number,
      lng: Schema.Number,
      bearing: Schema.Number,
      typeName: Schema.NonEmptyTrimmedString,
      uniqueName: Schema.UndefinedOr(Schema.String),
      desc: Schema.NonEmptyTrimmedString,
      radius: Schema.UndefinedOr(Schema.Number),
      nearbyTargetId: Schema.UndefinedOr(Schema.String),
      nearbyTargets: Schema.Array(Schema.String),
      expirationEpoch: Schema.UndefinedOr(Schema.Number),
      position: Schema.UndefinedOr(Schema.String),
    }))
  )
  .add(HttpApiEndpoint.post("removeObject", "/remove-object")
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
      targetId: Schema.UndefinedOr(Schema.NonEmptyTrimmedString),
      targets: Schema.UndefinedOr(Schema.Array(Schema.NonEmptyTrimmedString)),
    })))
    .add(HttpApiEndpoint.post("changeObject", "/change-object")
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
        targetId: Schema.UndefinedOr(Schema.NonEmptyTrimmedString),
        targets: Schema.UndefinedOr(Schema.Array(Schema.NonEmptyTrimmedString)),
        desc: Schema.String,
        typeName: Schema.UndefinedOr(Schema.String),
        uniqueName: Schema.UndefinedOr(Schema.String),
      }))
  ) {
}

export class MarmaidApi extends HttpApi.make("marmaid")
  // .add(MapsApiGroup)
  .add(ViewApiGroup) {
}
