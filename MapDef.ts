/*! map-traveler-mcp | MIT License | https://github.com/mfukushim/map-traveler-mcp */

import { Schema } from "effect"


//  region GoogleMap定義


/**
 * Google Map API定義
 */
export class MapDef {
  static readonly GmPlaceSchema = Schema.Struct({
    id: Schema.String,
    types: Schema.OptionFromUndefinedOr(Schema.Array(Schema.String)),
    formattedAddress: Schema.String,
    location: Schema.Struct({
      latitude: Schema.Number,
      longitude: Schema.Number,
    }),
    displayName: Schema.Struct({
      text: Schema.String,
      languageCode: Schema.UndefinedOr(Schema.String)
    }),
    primaryTypeDisplayName: Schema.OptionFromUndefinedOr(Schema.Struct({
      text: Schema.String,
      languageCode: Schema.String
    })),
    primaryType: Schema.OptionFromUndefinedOr(Schema.String),
    photos: Schema.OptionFromUndefinedOr(Schema.Array(Schema.Struct({
      name: Schema.String,
      authorAttributions: Schema.Array(Schema.Struct({
        displayName: Schema.String,
        photoUri: Schema.String,
      }))
    }))),
    addressComponents: Schema.OptionFromUndefinedOr(Schema.Array(Schema.Struct({
      shortText: Schema.String,
      longText: Schema.String,
      types: Schema.Array(Schema.String),
    })))
  })
  static readonly GmPlacesSchema = Schema.Array(MapDef.GmPlaceSchema)
  static readonly GmTextSearchSchema = Schema.Struct({
    places: MapDef.GmPlacesSchema
  })
  static readonly GmStepSchema = Schema.Struct({
      html_instructions: Schema.String,
      distance: Schema.Struct({
        text: Schema.String,
        value: Schema.Number,
      }),
      duration: Schema.Struct({
        text: Schema.String,
        value: Schema.Number,
      }),
      start_location: Schema.Struct({
        lat: Schema.Number,
        lng: Schema.Number
      }),
      end_location: Schema.Struct({
        lat: Schema.Number,
        lng: Schema.Number
      }),
      maneuver: Schema.UndefinedOr(Schema.String),  //  移動向きの意味だがフェリー旅では ferry の文字列が入っていた
      travel_mode: Schema.String
    }
  )

  static readonly DirectionStepSchema = Schema.mutable(Schema.Struct({
    ...MapDef.GmStepSchema.fields,
    pathNo: Schema.Number, //  連結経路のシーケンス番号 0～
    stepNo: Schema.Number, //  単一経路内の手順番号 0～
    isRelayPoint: Schema.Boolean, //  中継ポイント(google mapからではなく後付けで追加)
    start: Schema.Number,
    end: Schema.Number,
  }))
  static readonly GmLegSchema = Schema.Struct({
    start_address: Schema.UndefinedOr(Schema.String),
    end_address: Schema.UndefinedOr(Schema.String),
    end_location: Schema.UndefinedOr(Schema.Struct({
      lat: Schema.Number,
      lng: Schema.Number,
    })),
    start_location: Schema.UndefinedOr(Schema.Struct({
      lat: Schema.Number,
      lng: Schema.Number,
    })),
    distance: Schema.Struct({
      text: Schema.String,
      value: Schema.Number,
    }),
    duration: Schema.Struct({
      text: Schema.String,
      value: Schema.Number,
    }),
    steps: Schema.NonEmptyArray(MapDef.GmStepSchema)
  })
  static readonly LegSchema = Schema.Struct({
    ...MapDef.GmLegSchema.fields,
    start_country: Schema.String,  //  処理都合の拡張
    end_country: Schema.String,  //  処理都合の拡張
  })
  static readonly GmRouteSchema = Schema.Struct({
    summary: Schema.String,
    legs: Schema.NonEmptyArray(MapDef.GmLegSchema) //  legは1個だけ見ればよかったような(複数ルーティング候補の仕組みだったはず
  })

  static readonly RouteSchema = Schema.Struct({
    summary: Schema.String,
    leg: MapDef.LegSchema,
  })
  static readonly RouteArraySchema = Schema.Array(MapDef.RouteSchema)
  static readonly DirectionsSchema = Schema.Struct({
    status: Schema.String,
    routes: Schema.Array(MapDef.GmRouteSchema)
  })
  static readonly ErrorSchema = Schema.Struct({
    error: Schema.Struct({
      code: Schema.Number,
      message: Schema.String,
      status: Schema.String,
    })
  })
  static readonly EmptySchema = Schema.Struct({
  })
}
//  endregion
