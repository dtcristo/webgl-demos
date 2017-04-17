module Screensaver exposing (main)

import AnimationFrame
import Html exposing (Html)
import Html.Attributes exposing (width, height, style)
import Math.Matrix4 as Matrix4 exposing (Mat4)
import Math.Vector3 as Vector3 exposing (Vec3, vec3)
import Math.Vector4 as Vector4 exposing (Vec4, vec4)
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


type Direction
    = Positive
    | Negative


type alias Color =
    Vec4


type alias Model =
    { size : Window.Size
    , x : Float
    , y : Float
    , xDirection : Direction
    , yDirection : Direction
    , color : Color
    }


init : ( Model, Cmd Msg )
init =
    ( { size = Window.Size 0 0
      , x = 100
      , y = 100
      , xDirection = Positive
      , yDirection = Positive
      , color = vec4 0 0 1 1
      }
    , Task.perform Resize Window.size
    )



-- UPDATE


type Msg
    = Resize Window.Size
    | Frame Time


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Resize size ->
            ( { model | size = size }, Cmd.none )

        Frame dt ->
            ( step model dt, Cmd.none )


step : Model -> Time -> Model
step model dt =
    let
        ds =
            dt / 20

        ( xNew, xDirectionNew, xBounce ) =
            stepDirection model.size.width model.xDirection model.x ds

        ( yNew, yDirectionNew, yBounce ) =
            stepDirection model.size.height model.yDirection model.y ds
    in
        { model
            | x = xNew
            , y = yNew
            , xDirection = xDirectionNew
            , yDirection = yDirectionNew
        }


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
        |> Matrix4.translate (vec3 model.x model.y 0)
        |> Matrix4.scale (vec3 meshScale meshScale 0)


projection : Window.Size -> Mat4
projection size =
    Matrix4.makeOrtho2D 0 (toFloat size.width) (toFloat size.height) 0
