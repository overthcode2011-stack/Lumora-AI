-- Memoria de Lumora AI.
return {
  version = 1,
  facts = {
    {
      id = "ui_estructura",
      categoria = "UI",
      texto = "La raíz de toda interfaz es ScreenGui dentro de StarterGui (se clona a PlayerGui de cada jugador). Dentro van Frame (contenedores), TextLabel (texto no interactivo), TextButton/ImageButton (botones) y TextBox (entrada). Los TextButton disparan MouseButton1Click al hacer clic.",
      tags = { "UI", "ScreenGui", "PlayerGui", "Frame" }
    },
    {
      id = "ui_udim2",
      categoria = "UI",
      texto = "UDim2.new(XScale, XOffset, YScale, YOffset). Usa Scale (0-1) para tamaño relativo y Offset (px) para ajustes finos. Para centrar: AnchorPoint = Vector2.new(0.5,0.5) y Position = UDim2.fromScale(0.5,0.5). Evita offsets fijos en móvil.",
      tags = { "UI", "UDim2", "responsive" }
    },
    {
      id = "ui_eventos",
      categoria = "UI",
      texto = "En botones de GUI el evento correcto es MouseButton1Click (o Activated). Nunca uses Touched en un TextButton: Touched solo existe en BasePart (mundo 3D).",
      tags = { "UI", "eventos", "MouseButton1Click" }
    },
    {
      id = "ui_visible",
      categoria = "UI",
      texto = "Para ocultar/mostrar un GuiObject usa la propiedad Visible. Para ocultar una Part 3D usa Transparency = 1 (no existe Visible en Part).",
      tags = { "UI", "Visible", "Part", "Transparency" }
    },
    {
      id = "ui_animacion",
      categoria = "UI",
      texto = "Animaciones con TweenService:Create(objeto, TweenInfo.new(t, estilo, direccion), propiedadesDestino). Ejemplo deslizar desde abajo: Position inicial fuera de pantalla a UDim2.fromScale(0.5,0.5) con AnchorPoint centrado.",
      tags = { "UI", "TweenService", "animación" }
    },
    {
      id = "ui_layout",
      categoria = "UI",
      texto = "Usa UIListLayout, UIPadding y UIGridLayout para organizar elementos sin posiciones manuales. UIScale permite escalar toda la UI por dispositivo.",
      tags = { "UI", "UIListLayout", "UIGridLayout", "UIScale" }
    },
    {
      id = "ui_antipatron",
      categoria = "UI",
      texto = "Anti-patrón común: crear un TextButton con Position = Vector3 y conectarlo con Touched. Es incorrecto: los GuiObject usan UDim2 y viven en ScreenGui, no en workspace.",
      tags = { "UI", "anti-patrón" }
    },

    -- ===== SERVICIOS Y ARQUITECTURA =====
    {
      id = "svc_ubicaciones",
      categoria = "Servicios",
      texto = "Ubicaciones: ServerScriptService (lógica servidor), ReplicatedStorage (módulos y RemoteEvents compartidos), ServerStorage (assets solo servidor), StarterGui (plantillas de UI), StarterPlayerScripts (LocalScripts del jugador).",
      tags = { "servicios", "arquitectura" }
    },
    {
      id = "svc_getservice",
      categoria = "Servicios",
      texto = "Adquiere cada servicio una vez con game:GetService(\"Nombre\"), nunca con game.Nombre ni buscándolo en el árbol.",
      tags = { "servicios", "GetService" }
    },
    {
      id = "svc_remote",
      categoria = "Servicios",
      texto = "RemoteEvent: comunicación unidireccional (cliente->servidor o servidor->cliente) sin esperar respuesta; ideal para acciones. RemoteFunction: solicitud/respuesta síncrona; solo cuando el cliente necesite un valor de vuelta inmediato. Evita RemoteFunction en bucles.",
      tags = { "servicios", "RemoteEvent", "RemoteFunction" }
    },
    {
      id = "svc_datastore",
      categoria = "Servicios",
      texto = "DataStoreService: guarda con SetAsync y carga con GetAsync siempre dentro de pcall. Guarda en PlayerRemoving y carga en PlayerAdded. Key única: \"Player_\"..userId. No guardes en bucles rápidos (límite de solicitudes). Para producción considera ProfileService.",
      tags = { "servicios", "DataStore", "persistencia" }
    },
    {
      id = "svc_runservice",
      categoria = "Servicios",
      texto = "RunService: Heartbeat (cada frame en servidor/cliente), PreRender (antes de render en cliente), RenderStepped (solo cliente, para cámara/UI por frame). Usa task.wait, nunca wait.",
      tags = { "servicios", "RunService", "task.wait" }
    },
    {
      id = "svc_seguridad",
      categoria = "Servicios",
      texto = "Regla de oro: el cliente nunca es confiable. Toda validación de compras, daño o inventario debe ejecutarse en el servidor; los RemoteEvents solo transportan intención, no resultados.",
      tags = { "servicios", "seguridad", "anti-cheat" }
    },
    {
      id = "lua_luau",
      categoria = "Luau",
      texto = "Luau moderno: usa task.wait/task.spawn/task.delay en lugar de wait/spawn/delay. Tipado opcional con :: y type. Nunca uses loadstring en el servidor.",
      tags = { "Luau", "task.wait", "tipado" }
    }
  }
}
