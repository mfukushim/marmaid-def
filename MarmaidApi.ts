/*! map-space-mcp | MIT License | https://github.com/mfukushim/map-space-mcp */

import {HttpApi, HttpApiEndpoint, HttpApiGroup} from "@effect/platform"
import {Schema} from "effect"
import {MapDef} from "./MapDef.js";

export type Vec3 = [number, number, number];
export type Point = [number, number];


export const MapId = Schema.Number.pipe(Schema.brand("MapId"))
export type MapId = typeof MapId.Type


class TimezoneSchema extends Schema.Class<TimezoneSchema>("TimezoneSchema")({
  status: Schema.NonEmptyTrimmedString,
  timeZoneId: Schema.UndefinedOr(Schema.String)
}) {
}

export class MapNotFound extends Schema.TaggedError<MapNotFound>()("MapNotFound", {
  id: Schema.Number
}) {
}

export class GenericError extends Schema.TaggedError<GenericError>()("GenericError", {
  mes: Schema.String
}) {
}

export class SearchNearParam extends Schema.Class<SearchNearParam>("SearchNearParam")({
  maxResultCount: Schema.Number,
  languageCode: Schema.String,
  locationRestriction: Schema.Struct({
    circle: Schema.Struct({
      radius: Schema.Number,
      center: Schema.Struct({
        lat: Schema.Number,
        lng: Schema.Number
      })
    })
  })
}) {
}

export class StreetViewParam extends Schema.Class<StreetViewParam>("StreetViewParam")({
  size: Schema.String,
  location: Schema.String,
  fov: Schema.NumberFromString,
  heading: Schema.NumberFromString,
  pitch: Schema.NumberFromString,
  key: Schema.String,
  return_error_code: Schema.BooleanFromString
}) {
}

export class LocationParam extends Schema.Class<NearbyParam>("NearbyParam")({
  // maxResultCount: Schema.Number,
  // languageCode: Schema.String,
  lat: Schema.Number,  //  緯度での近似
  lng: Schema.Number, //
  bearing: Schema.Number, //  北=0,東=90
  radius: Schema.Number,  //  m単位
}) {

}

const CamPosSchema = Schema.Literal(
  'none',
  'front',
  'upper',
  'lower',
  'left',
  'right',
  'upper right',
  'upper left',
  'lower right',
  'lower left')

const CamDistSchema = Schema.Literal(
  '',
  'very close',
  'close',
  'in distance',
  'in very far away',
)

export type CamPos = typeof CamPosSchema.Type
export type CamDist = typeof CamDistSchema.Type

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

export class ExistenceSchema extends Schema.Class<ExistenceSchema>("ExistenceSchema")({
  id: Schema.String,
  typeName: Schema.String,
  uniqueName: Schema.UndefinedOr(Schema.String),
  parentRegionId: Schema.UndefinedOr(Schema.String),
  hasObject: Schema.Boolean,
  desc: Schema.String,
  dist: Schema.Number,
  radius: Schema.Number,
  camPos: CamPosSchema, //  カメラビュー文言相対位置
  pos2d: Schema.Array(Schema.Number), //  カメラ座標上面2d位置
  pos3d: Schema.Array(Schema.Number), //  カメラ座標系3d位置
}) {
}

export class ViewInfoSchema extends Schema.Class<ViewInfoSchema>("ViewInfoSchema")({
  id: Schema.String,
  typeName: Schema.String,
  uniqueName: Schema.UndefinedOr(Schema.String),
  hasObject: Schema.Boolean,
  desc: Schema.String,
  dist: Schema.Number,
  radius: Schema.Number,
  camPos: CamPosSchema, //  カメラビュー文言相対位置
  camDist: CamDistSchema, //  カメラビュー文言相対位置
}) {
}

export class NearbyParam extends Schema.Class<NearbyParam>("NearbyParam")({
  userId: Schema.String,
  nearLocation: LocationParam,
}) {
}


export const ObjRegionInfoSchema = Schema.Struct({
  id: Schema.String,
  typeName: Schema.String,
  uniqueName: Schema.Option(Schema.String),
  parentRegionId: Schema.Option(Schema.String),
  hasObject: Schema.Boolean,
  desc: Schema.String,
  //  locationかoffsetで指定 offsetの場合はparentRegionIdが必須
  location: Schema.Option(Schema.Struct({
    lat: Schema.Number,
    lng: Schema.Number,
  })),
  offset: Schema.Option(Schema.Struct({
    x: Schema.Number,
    y: Schema.Number,
  })),
  radius: Schema.Option(Schema.Number),
  frontAngle: Schema.Option(Schema.Number),
})

export interface CameraCoordinateExistenceInfo {
  target: typeof ObjRegionInfoSchema.Type | typeof ObjRegionInfoSchema.Type;
  pos2D: Point;
  pos3D: Vec3,
}

export const MarmaidTextSearchSchema = Schema.Struct({
  places: MapDef.GmPlacesSchema,
  // regions: Schema.UndefinedOr(Schema.Array(ObjRegionInfoSchema)),
  objects: Schema.UndefinedOr(Schema.Array(ObjRegionInfoSchema)),
})


export class MapsApiGroup extends HttpApiGroup.make("maps")
  .add(HttpApiEndpoint.get("directions", "/directions")
    .addSuccess(Schema.Union(
      MapDef.DirectionsSchema,
      MapDef.ErrorSchema,
      MapDef.EmptySchema,
    ))
    .setUrlParams(Schema.Struct({
      origin: Schema.String,
      destination: Schema.String,
      mode: Schema.String,
      key: Schema.String
    }))
  )
  .add(
    HttpApiEndpoint.get("timezone", "/timezone")
      .addSuccess(TimezoneSchema)
      .addError(MapNotFound, {status: 404})
      .setUrlParams(Schema.Struct({location: Schema.String, timestamp: Schema.String, key: Schema.String}))
  )
  .add(
    HttpApiEndpoint.post("searchText", "/searchText")
      .addSuccess(Schema.Union(
        MarmaidTextSearchSchema,
        MapDef.ErrorSchema,
        MapDef.EmptySchema,
      ))
      .setPayload(Schema.Struct({textQuery: Schema.NonEmptyTrimmedString}))
  )
  .add(
    HttpApiEndpoint.post("searchNearby", "/searchNearby")
      .addSuccess(Schema.Union(
        MarmaidTextSearchSchema,
        MapDef.ErrorSchema,
        MapDef.EmptySchema,
      ))
      .addError(MapNotFound, {status: 404})
      .setPayload(SearchNearParam)
  )
  .add(
    HttpApiEndpoint.get("metadata", "/metadata")
      .addSuccess(Schema.Struct({
        status: Schema.Number,
      }))
      .addError(MapNotFound, {status: 404})
      .setUrlParams(StreetViewParam)
  )
  .add(
    HttpApiEndpoint.get("streetview", "/streetview")
      .addSuccess(Schema.Uint8Array)
      .addError(MapNotFound, {status: 404})
      .setUrlParams(StreetViewParam)
  ) {
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
  .add(HttpApiEndpoint.get("viewPoint", "/view-point")
    .addSuccess(Schema.Struct({
        status: Schema.NonEmptyTrimmedString,
        points: Schema.Array(ExistenceSchema),
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
  .add(HttpApiEndpoint.get("viewInfo", "/view-info")
    .addSuccess(Schema.Struct({
        status: Schema.NonEmptyTrimmedString,
        regionDesc: Schema.String,
        regions: Schema.Array(ViewInfoSchema),
        objects: Schema.Array(ViewInfoSchema),
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
        excludeRegions: Schema.Array(ViewInfoSchema),
        reachableObjects: Schema.Array(ViewInfoSchema),
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
      targetId: Schema.UndefinedOr(Schema.NonEmptyTrimmedString),
      targets: Schema.UndefinedOr(Schema.Array(Schema.NonEmptyTrimmedString)),
    }).annotations({examples:[{userId:"1",proceed:1,targetId:undefined,targets:["living"],lat:30,lng:130,bearing:0}]}))
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
  .add(MapsApiGroup)
  .add(ViewApiGroup) {
}
