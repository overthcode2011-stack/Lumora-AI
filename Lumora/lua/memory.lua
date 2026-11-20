return {
  version = 1,
  facts = {
    {
      id = "screengui_es_contenedor",
      categoria = "UI",
      texto = "ScreenGui es un contenedor puro. No tiene Size, Position ni Visible. Esas propiedades pertenecen a Frame, TextButton, ImageLabel y demás GuiObject. Un ScreenGui solo se configura con Name, ResetOnSpawn, IgnoreGuiInset, DisplayOrder y ZIndexBehavior. Su Parent es PlayerGui.",
      tags = { "ScreenGui", "GuiObject", "jerarquía" }
    },
    {
      id = "screengui_visible_no_existe",
      categoria = "UI",
      texto = "ScreenGui.Visible no existe y lanzará error si se asigna. Para ocultar toda la interfaz se usa ScreenGui.Enabled = false, o se alterna la propiedad Visible de un Frame interno. Para ocultar una Part 3D se usa Transparency = 1.",
      tags = { "ScreenGui", "Enabled", "Visible", "anti-patrón" }
    },
    {
      id = "ui_jerarquia_correcta",
      categoria = "UI",
      texto = "Jerarquía correcta: Player.PlayerGui > ScreenGui > Frame > TextButton. El ScreenGui se crea en StarterGui (se clona a PlayerGui) o directamente en PlayerGui desde un LocalScript con Player:WaitForChild(\"PlayerGui\"). Un ScreenGui huérfano no se renderiza.",
      tags = { "PlayerGui", "ScreenGui", "StarterGui", "jerarquía" }
    },
    {
      id = "ui_toggle_frame_corregido",
      categoria = "UI",
      texto = "Patrón correcto para abrir/cerrar: un Frame con Visible = false y un TextButton que alterna Visible y actualiza el texto. MouseButton1Click en el botón, no Touched. Sin dos ScreenGui duplicados.",
      tags = { "Toggle", "Visible", "MouseButton1Click" },
      ejemplo = [[
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local gui = Instance.new("ScreenGui")
gui.Name = "GameInterface"
gui.ResetOnSpawn = false
gui.Parent = playerGui

local btn = Instance.new("TextButton")
btn.Name = "PlayButton"
btn.Size = UDim2.fromOffset(200, 50)
btn.Position = UDim2.new(0.5, -100, 0.8, 0)
btn.BackgroundColor3 = Color3.fromRGB(80, 120, 255)
btn.Text = "Jugar"
btn.TextColor3 = Color3.new(1, 1, 1)
btn.TextScaled = true
btn.Parent = gui

local interface = Instance.new("Frame")
interface.Name = "Interface"
interface.Size = UDim2.fromOffset(300, 200)
interface.Position = UDim2.new(0.5, -150, 0.5, -100)
interface.BackgroundColor3 = Color3.fromRGB(25, 25, 30)
interface.Visible = false
interface.Parent = gui

local function toggleInterface()
    interface.Visible = not interface.Visible
    btn.Text = interface.Visible and "Cerrar" or "Jugar"
end

btn.MouseButton1Click:Connect(toggleInterface)
      ]]
    },
    {
      id = "roblox_class_reference",
      categoria = "Referencia",
      texto = "Antes de asignar una propiedad, método o evento, verificar en la Class Reference oficial (create.roblox.com/docs/reference/engine/classes) que existe en esa clase. Las propiedades de GuiObject no aplican a ScreenGui; las de BasePart no aplican a GuiObject; las de Humanoid no aplican a Player. Instance.new(\"X\") solo acepta nombres exactos de clase existentes.",
      tags = { "Class Reference", "propiedades", "API" }
    },
    {
      id = "debugging_propiedades_inexistentes",
      categoria = "Debugging",
      texto = "Asignar una propiedad inexistente en Luau lanza un error en tiempo de ejecución con el nombre de la propiedad y la clase. Síntoma típico: \"X is not a valid member of Y\". Antes de culpar a la lógica, confirmar que la propiedad existe en la clase real. Un ScreenGui con Size, Position o Visible es el error más común al portar código de Part a GUI.",
      tags = { "debugging", "propiedades", "errores" }
    },
    {
      id = "debugging_errores_runtime",
      categoria = "Debugging",
      texto = "Flujo de debugging en Roblox Studio: leer el Output completo (no solo la última línea), identificar la clase del objeto y la propiedad o método del error, revisar la jerarquía con el Explorer, verificar el Parent de cada Instance.new. Errores frecuentes: Parent nil, WaitForChild sin timeout, CFrame asignado a Vector3 y viceversa, Font como enum incorrecto.",
      tags = { "debugging", "Output", "runtime" }
    },
    {
      id = "luau_local_function",
      categoria = "Luau",
      texto = "Usar local function en lugar de function global. Las funciones globales contaminan el entorno, impiden el tipado estricto y en Luau moderno se marcan con --!strict. Las funciones internas de un LocalScript o Script deben ser locales. Para exportar se usa ModuleScript con return.",
      tags = { "Luau", "local", "scope" }
    },
    {
      id = "luau_conexiones",
      categoria = "Luau",
      texto = "Cada :Connect() devuelve una RBXScriptConnection. Guardarla si se necesita :Disconnect() al destruir la UI o el personaje. Las conexiones a objetos destruidos se limpian solas en la mayoría de casos, pero las conexiones a servicios o a PlayerGui persisten entre respawns si ResetOnSpawn está en false.",
      tags = { "Luau", "RBXScriptConnection", "Disconnect" }
    },
    {
      id = "luau_tipado",
      categoria = "Luau",
      texto = "Luau soporta tipado opcional con --!strict y anotaciones tipo `local x: number = 1`. Ayuda a detectar propiedades inexistentes antes de ejecutar. Los tipos de instancia se escriben como `Instance`, `Part`, `TextButton`, etc. No obligatorio, pero reduce errores en proyectos grandes.",
      tags = { "Luau", "tipado", "strict" }
    },
    {
      id = "luau_vs_python_jerarquia",
      categoria = "Luau",
      texto = "En Roblox la jerarquía es explícita: cada objeto debe tener Parent asignado para existir en el árbol. Un Instance.new sin Parent es solo memoria. Los LocalScripts se ejecutan en el cliente (PlayerGui, StarterPlayerScripts, StarterCharacterScripts) y los Scripts en el servidor (ServerScriptService, Workspace).",
      tags = { "Luau", "Parent", "LocalScript", "Script" }
    }
  }
}
