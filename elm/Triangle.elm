module Triangle exposing (main)

import Html exposing (Html)
import Html.Attributes exposing (width, height, style)
import Math.Vector3 exposing (Vec3, vec3)
import Task
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


type alias Model =
    { size : Window.Size }



-- UPDATE


type Msg
    = Resize Window.Size


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Resize size ->
            ( { model | size = size }, Cmd.none )



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
            {}
        ]



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions model =
    Window.resizes Resize



-- INIT


init : ( Model, Cmd Msg )
init =
    ( { size = Window.Size 0 0 }
    , Task.perform Resize Window.size
    )



-- MESH


type alias Vertex =
    { position : Vec3
    , color : Vec3
    }


mesh : Mesh Vertex
mesh =
    WebGL.triangles
        [ ( Vertex (vec3 -0.5 -0.5 0) (vec3 1 0 0)
          , Vertex (vec3 0.5 -0.5 0) (vec3 0 1 0)
          , Vertex (vec3 0 0.5 0) (vec3 0 0 1)
          )
        ]



-- SHADERS


type alias Varyings =
    { vColor : Vec3 }


vertexShader : Shader Vertex {} Varyings
vertexShader =
    [glsl|

        attribute vec3 position;
        attribute vec3 color;

        varying vec3 vColor;

        void main () {
            gl_Position = vec4(position, 1);
            vColor = color;
        }

    |]


fragmentShader : Shader {} {} Varyings
fragmentShader =
    [glsl|

        precision mediump float;

        varying vec3 vColor;

        void main () {
            gl_FragColor = vec4(vColor, 1);
        }

    |]
