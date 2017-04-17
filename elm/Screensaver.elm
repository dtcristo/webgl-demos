module Screensaver exposing (main)

import AnimationFrame
import Html exposing (Html)
import Html.Attributes exposing (width, height, style)
import Math.Matrix4 as Matrix4 exposing (Mat4)
import Math.Vector3 as Vector3 exposing (Vec3, vec3)
import Math.Vector4 as Vector4 exposing (Vec4, vec4)
import Random exposing (Generator, Seed)
import Task
import Time exposing (Time)
import WebGL exposing (Mesh, Shader)
import Window


main =
    Html.program
        { init = init
        , view = view
        , subscriptions = subscriptions
        , update = update
        }



-- MODEL


type alias Position =
    { x : Float
    , y : Float
    }


type Direction
    = Positive
    | Negative


type alias Color =
    Vec4


type alias Model =
    { position : Position
    , direction :
        { x : Direction
        , y : Direction
        }
    , color : Color
    , size : Window.Size
    }


init : ( Model, Cmd Msg )
init =
    ( { position = Position 100 100
      , direction =
            { x = Positive
            , y = Positive
            }
      , color = vec4 0 0 0 1
      , size = Window.Size 0 0
      }
    , Cmd.batch
        [ Random.generate NewColor randomColor
        , Task.perform Resize Window.size
        ]
    )



-- UPDATE


type Msg
    = Resize Window.Size
    | Frame Time
    | NewColor Color


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Resize size ->
            ( { model | size = size }, Cmd.none )

        Frame dt ->
            step model dt

        NewColor newColor ->
            ( { model | color = newColor }, Cmd.none )


step : Model -> Time -> ( Model, Cmd Msg )
step model dt =
    let
        ds =
            1

        ( xNew, xDirectionNew, xBounce ) =
            stepDirection model.size.width model.direction.x model.position.x ds

        ( yNew, yDirectionNew, yBounce ) =
            stepDirection model.size.height model.direction.y model.position.y ds

        cmd =
            if xBounce || yBounce then
                Random.generate NewColor randomColor
            else
                Cmd.none
    in
        ( { model
            | position = Position xNew yNew
            , direction =
                { x = xDirectionNew
                , y = yDirectionNew
                }
          }
        , cmd
        )


stepDirection : Int -> Direction -> Float -> Float -> ( Float, Direction, Bool )
stepDirection size direction initial ds =
    case direction of
        Positive ->
            let
                new =
                    initial + ds
            in
                if new + meshScale > toFloat size then
                    ( new, Negative, True )
                else
                    ( new, Positive, False )

        Negative ->
            let
                new =
                    initial - ds
            in
                if new < 0 then
                    ( new, Positive, True )
                else
                    ( new, Negative, False )


randomColor : Generator Color
randomColor =
    Random.map
        -- Keep alpha level constant
        (\a -> a 1)
        (Random.map3
            vec4
            (Random.float 0 1)
            (Random.float 0 1)
            (Random.float 0 1)
        )



-- VIEW


view : Model -> Html Msg
view model =
    WebGL.toHtmlWith
        [ WebGL.clearColor 0 0 0 0 ]
        [ width model.size.width
        , height model.size.height
        , style [ ( "display", "block" ) ]
        ]
        [ WebGL.entity
            vertexShader
            fragmentShader
            mesh
            { transformation = transformation model
            , color = model.color
            }
        ]



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ Window.resizes Resize
        , AnimationFrame.diffs Frame
        ]



-- MESH


type alias Vertex =
    { position : Vec3 }


mesh : Mesh Vertex
mesh =
    WebGL.triangles
        [ ( Vertex (vec3 0 0 0)
          , Vertex (vec3 0 1 0)
          , Vertex (vec3 1 0 0)
          )
        , ( Vertex (vec3 1 0 0)
          , Vertex (vec3 0 1 0)
          , Vertex (vec3 1 1 0)
          )
        ]


meshScale : Float
meshScale =
    100



-- SHADERS


type alias Uniforms =
    { transformation : Mat4
    , color : Vec4
    }


vertexShader : Shader Vertex Uniforms {}
vertexShader =
    [glsl|

        attribute vec3 position;

        uniform mat4 transformation;

        void main () {
            gl_Position = transformation * vec4(position, 1);
        }

    |]


fragmentShader : Shader {} Uniforms {}
fragmentShader =
    [glsl|

        precision mediump float;

        uniform vec4 color;

        void main () {
            gl_FragColor = color;
        }

    |]



-- MATRICIES


transformation : Model -> Mat4
transformation model =
    projection model.size
        |> Matrix4.translate (vec3 model.position.x model.position.y 0)
        |> Matrix4.scale (vec3 meshScale meshScale 0)


projection : Window.Size -> Mat4
projection size =
    Matrix4.makeOrtho2D 0 (toFloat size.width) (toFloat size.height) 0
