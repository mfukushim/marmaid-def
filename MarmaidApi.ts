/*! map-traveler-mcp | MIT License | https://github.com/mfukushim/map-traveler-mcp */

import {HttpApi, HttpApiEndpoint, HttpApiGroup} from "@effect/platform"
import {Schema} from "effect"
import {MapDef} from "./MapDef.js";

export type Vec3 = [number, number, number];
export type Point = [number, number];


export const MapId = Schema.Number.pipe(Schema.brand("MapId"))
export type MapId = typeof MapId.Type

export const MapIdFromString = Schema.NumberFromString.pipe(
  Schema.compose(MapId)
)

export class Map extends Schema.Class<Map>("Map")({
  id: MapId,
  text: Schema.NonEmptyTrimmedString,
  done: Schema.Boolean
}) {
}

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

export class ViewInfoSchema extends Schema.TaggedError<ViewInfoSchema>()('ViewInfoSchema', {
  status: Schema.NonEmptyTrimmedString,
  objs: Schema.Array(Schema.Struct({
    name: Schema.String,
    //  TODO 補助情報がいるか?
  })),
  regions: Schema.Array(Schema.Struct({
    name: Schema.String,
    //  TODO 補助情報がいるか?
  }))
}) {
}

export class SearchNearParam extends Schema.Class<SearchNearParam>("SearchNearParam")({
  maxResultCount: Schema.Number,
  languageCode: Schema.String,
  locationRestriction: Schema.Struct({
    circle: Schema.Struct({
      radius: Schema.Number,
      center: Schema.Struct({
        latitude: Schema.Number,
        longitude: Schema.Number
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

export const NearbyParamSchema = Schema.Struct({
  // maxResultCount: Schema.Number,
  // languageCode: Schema.String,
  latitude: Schema.Number,  //  緯度での近似
  longitude: Schema.Number, //  
  bearing: Schema.Number, //  北=0,東=90
  radius: Schema.Number,  //  m単位
  // locationRestriction: Schema.Struct({
  //   circle: Schema.Struct({
  //     center: Schema.Struct({
  //       latitude: Schema.Number,
  //       longitude: Schema.Number
  //     }),
  //     radius: Schema.Number,
  //   })
  // })
})

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

export type CamPos = typeof CamPosSchema.Type

const LocStatusSchema = Schema.Literal(
  'error',
  'exist',
  'notFound',
  )

export type LocStatus = typeof LocStatusSchema.Type

// 'front'
// | 'upper'
// | 'bottom'
// | 'left'
// | 'right'
// | 'upper right'
// | 'upper left'
// | 'bottom right'
// | 'bottom left';

export class ExistenceSchema extends Schema.Class<ExistenceSchema>("ExistenceSchema")({
  id: Schema.String,
  typeName: Schema.String,
  uniqueName: Schema.UndefinedOr(Schema.String),
  parentRegionId: Schema.UndefinedOr(Schema.String),
  isObject: Schema.Boolean,
  desc: Schema.String,
  dist: Schema.Number,
  camPos: CamPosSchema, //  カメラビュー文言相対位置
  pos2d: Schema.Array(Schema.Number), //  カメラ座標上面2d位置
  pos3d: Schema.Array(Schema.Number), //  カメラ座標系3d位置
}) {
}

// export const ExistenceSchemaArray = Schema.Array(ExistenceSchema)

export class NearbyParam extends Schema.Class<NearbyParam>("NearbyParam")({
  userId: Schema.String,
  nearLocation: NearbyParamSchema,
}) {
}

export const RegionInfoSchema = Schema.Struct({
  id: Schema.String,
  parentRegionId: Schema.Option(Schema.String),
  typeName: Schema.String,
  uniqueName: Schema.Option(Schema.String),
  desc: Schema.String,
  dist: Schema.Number,
  //  locationかoffsetで指定 offsetの場合はparentRegionIdが必須
  location: Schema.Option(Schema.Struct({
    latitude: Schema.Number,
    longitude: Schema.Number,
  })),
  offset: Schema.Option(Schema.Struct({
    x: Schema.Number,
    y: Schema.Number,
  })),
  radius: Schema.Number,
  // radius: Schema.Array(Schema.Number),
  // camRangePos:Schema.Array(Schema.Array(Schema.Number)),
})

export const ObjectInfoSchema = Schema.Struct({
  id: Schema.String,
  typeName: Schema.String,
  uniqueName: Schema.Option(Schema.String),
  parentRegionId: Schema.String,  //  すべてのオブジェクトはRegionの子 単一物体でもregion-objectの対となる
  desc: Schema.String,
  offset: Schema.Option(Schema.Struct({ //  オブジェクトはregionとの相対位置を持つが、なくてもよい(所属することが示されているだけでも画像生成はできなければならない)
    x: Schema.Number,
    y: Schema.Number,
    z: Schema.Number,
  })),
  // pos: Schema.Array(Schema.Number),
})

export interface CameraCoordinateExistenceInfo {
  target: typeof RegionInfoSchema.Type | typeof ObjectInfoSchema.Type;
  pos2D: Point;
  pos3D: Vec3,
}

export const MarmaidTextSearchSchema = Schema.Struct({
  places: MapDef.GmPlacesSchema,
  regions: Schema.UndefinedOr(Schema.Array(RegionInfoSchema)),
  objects: Schema.UndefinedOr(Schema.Array(ObjectInfoSchema)),
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
      userId: Schema.NonEmptyTrimmedString,
      targets: Schema.Array(Schema.NonEmptyTrimmedString),
      lat: Schema.Number,
      lng: Schema.Number,
      bearing: Schema.Number
    }))
  )
    .add(HttpApiEndpoint.post("moveToTarget", "/move-to-target")
      .addSuccess(Schema.Struct({
          status: LocStatusSchema,
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
      }))
  )
  // .add(HttpApiEndpoint.post("viewInfo", "/view-info")
  //     .addSuccess(ViewInfoSchema)
  //     .addError(GenericError, { status: 500 })
  //     .setPayload(NearbyParam)
  // )
{
}

export class MarmaidApi extends HttpApi.make("marmaid")
  .add(MapsApiGroup)
  .add(ViewApiGroup) {
}
