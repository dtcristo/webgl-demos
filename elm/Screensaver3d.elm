module Screensaver3d exposing (main)

import AnimationFrame
import Color exposing (Color)
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


type alias Model =
    { position : Position
    , direction :
        { x : Direction
        , y : Direction
        }
    , theta : Float
    , size : Window.Size
    }


init : ( Model, Cmd Msg )
init =
    ( { position = Position 100 100
      , direction =
            { x = Positive
            , y = Positive
            }
      , theta = 0
      , size = Window.Size 0 0
      }
    , Task.perform Resize Window.size
    )



-- UPDATE


type Msg
    = Resize Window.Size
    | Frame Time



-- | NewColor Color


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Resize size ->
            ( { model | size = size }, Cmd.none )

        Frame dt ->
            step model dt


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
                Cmd.none
            else
                Cmd.none
    in
        ( { model
            | position = Position xNew yNew
            , direction =
                { x = xDirectionNew
                , y = yDirectionNew
                }
            , theta = model.theta + dt / 5000
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
                if new + (2 * meshScale) > toFloat size then
                    ( new, Negative, True )
                else
                    ( new, Positive, False )

        Negative ->
            let
                new =
                    initial - ds
            in
                if new - (2 * meshScale) < 0 then
                    ( new, Positive, True )
                else
                    ( new, Negative, False )



-- VIEW


view : Model -> Html Msg
view model =
    WebGL.toHtmlWith
        [ WebGL.clearColor 0 0 0 1
        , WebGL.depth 1
        ]
        [ width model.size.width
        , height model.size.height
        , style [ ( "display", "block" ) ]
        ]
        [ WebGL.entity
            vertexShader
            fragmentShader
            mesh
            { transformation =
                transformation model
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
    { color : Vec3
    , position : Vec3
    }


mesh : Mesh Vertex
mesh =
    let
        rft =
            vec3 1 1 1

        lft =
            vec3 -1 1 1

        lbt =
            vec3 -1 -1 1

        rbt =
            vec3 1 -1 1

        rbb =
            vec3 1 -1 -1

        rfb =
            vec3 1 1 -1

        lfb =
            vec3 -1 1 -1

        lbb =
            vec3 -1 -1 -1
    in
        [ face Color.green rft rfb rbb rbt
        , face Color.blue rft rfb lfb lft
        , face Color.yellow rft lft lbt rbt
        , face Color.red rfb lfb lbb rbb
        , face Color.purple lft lfb lbb lbt
        , face Color.orange rbt rbb lbb lbt
        ]
            |> List.concat
            |> WebGL.triangles


face : Color -> Vec3 -> Vec3 -> Vec3 -> Vec3 -> List ( Vertex, Vertex, Vertex )
face rawColor a b c d =
    let
        color =
            let
                c =
                    Color.toRgb rawColor
            in
                vec3
                    (toFloat c.red / 255)
                    (toFloat c.green / 255)
                    (toFloat c.blue / 255)

        vertex position =
            Vertex color position
    in
        [ ( vertex a, vertex b, vertex c )
        , ( vertex c, vertex d, vertex a )
        ]


meshScale : Float
meshScale =
    50



-- SHADERS


type alias Uniforms =
    { transformation :
        Mat4
    }


type alias Varyings =
    { vColor : Vec3
    }


vertexShader : Shader Vertex Uniforms Varyings
vertexShader =
    [glsl|

        attribute vec3 position;
        attribute vec3 color;

        uniform mat4 transformation;

        varying vec3 vColor;

        void main () {
            gl_Position = transformation * vec4(position, 1);
            vColor = color;
        }

    |]


fragmentShader : Shader {} Uniforms Varyings
fragmentShader =
    [glsl|

        precision mediump float;

        varying vec3 vColor;

        void main () {
            gl_FragColor = vec4(vColor, 1);
        }

    |]



-- MATRICIES


transformation : Model -> Mat4
transformation model =
    projection model.size
        |> Matrix4.translate (vec3 model.position.x model.position.y 0)
        |> Matrix4.rotate (4 * model.theta) (vec3 1 0 0)
        |> Matrix4.rotate (2 * model.theta) (vec3 0 1 0)
        |> Matrix4.rotate (2 * model.theta) (vec3 0 0 1)
        |> Matrix4.scale (vec3 meshScale meshScale meshScale)


projection : Window.Size -> Mat4
projection size =
    Matrix4.makeOrtho
        0
        (toFloat size.width)
        (toFloat size.height)
        0
        (-2 * meshScale)
        (2 * meshScale)
