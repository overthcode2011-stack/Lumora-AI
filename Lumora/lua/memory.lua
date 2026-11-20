return {
  version = 1,
  facts = {
    {
      id = "leaderstats_produccion",
      categoria = "Datos",
      texto = "Leaderstats es un Folder llamado \"leaderstats\" con IntValue dentro, creado en PlayerAdded desde ServerScriptService. El guardado real se hace con DataStoreService, nunca con los valores del leaderstats directamente. UpdateAsync es obligatorio si hay riesgo de escrituras concurrentes (compras, trades). BindToClose debe guardar a todos los jugadores y esperar; el servidor mata el hilo a los 30 s.",
      tags = { "leaderstats", "DataStoreService", "UpdateAsync", "BindToClose" },
      ejemplo = [[
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local store = DataStoreService:GetDataStore("PlayerStats_v1")

local function loadData(player)
    local ls = Instance.new("Folder")
    ls.Name = "leaderstats"
    ls.Parent = player

    local coins = Instance.new("IntValue")
    coins.Name = "Coins"
    coins.Parent = ls

    local level = Instance.new("IntValue")
    level.Name = "Level"
    level.Value = 1
    level.Parent = ls

    local ok, data = pcall(store.GetAsync, store, "Player_" .. player.UserId)
    if ok and data then
        coins.Value = data.Coins or 0
        level.Value = data.Level or 1
    end
end

local function saveData(player)
    local ls = player:FindFirstChild("leaderstats")
    if not ls then return end
    pcall(store.UpdateAsync, store, "Player_" .. player.UserId, function(old)
        old = old or {}
        old.Coins = ls.Coins.Value
        old.Level = ls.Level.Value
        return old
    end)
end

Players.PlayerAdded:Connect(loadData)
Players.PlayerRemoving:Connect(saveData)
game:BindToClose(function()
    for _, p in Players:GetPlayers() do task.spawn(saveData, p) end
    task.wait(3)
end)
      ]]
    },
    {
      id = "profilestore_estandar",
      categoria = "Datos",
      texto = "ProfileStore (sucesor de ProfileService, de loleris) es el estándar para juegos con economía, trades o gifting: Adopt Me, Pet Simulator, Grow a Garden. Implementa session locking: un perfil solo se carga en un servidor a la vez mediante UpdateAsync. DataStore2 ya no se recomienda para proyectos nuevos porque no tiene session locking nativo. ProfileStore añade auto-guardado, MetaTags y GlobalUpdates.",
      tags = { "ProfileStore", "ProfileService", "session locking", "DataStore2" },
      referencia = "github.com/MadStudioRoblox/ProfileService"
    },
    {
      id = "ordereddatastore_leaderboard_global",
      categoria = "Datos",
      texto = "OrderedDataStore solo acepta enteros positivos y se consulta con GetSortedAsync. Se usa para leaderboards globales (top coins en Pet Simulator, top level en Blox Fruits). El key es el UserId como string y el value el número. No se escribe en cada frame: solo cuando el valor cambia de forma significativa.",
      tags = { "OrderedDataStore", "GetSortedAsync", "leaderboard" },
      ejemplo = [[
local DataStoreService = game:GetService("DataStoreService")
local board = DataStoreService:GetOrderedDataStore("TopCoins_v1")

local function updateBoard(player)
    local ls = player:FindFirstChild("leaderstats")
    if not ls then return end
    pcall(board.SetAsync, board, tostring(player.UserId), ls.Coins.Value)
end

local function getTop10()
    local pages = board:GetSortedAsync(false, 10)
    local data = pages:GetCurrentPage()
    for rank, entry in ipairs(data) do
        print(rank, entry.key, entry.value)
    end
end
      ]]
    },
    {
      id = "processreceipt_unico",
      categoria = "Monetización",
      texto = "MarketplaceService.ProcessReceipt se asigna UNA vez en un solo Script de servidor. Si se asigna dos veces, la segunda sobrescribe la primera y los productos anteriores dejan de funcionar. Roblox vuelve a llamar a ProcessReceipt hasta que devuelvas PurchaseGranted; solo debes devolverlo tras confirmar la entrega. BindReceiptHandler es la alternativa moderna con filtros por ProductId.",
      tags = { "MarketplaceService", "ProcessReceipt", "BindReceiptHandler" },
      ejemplo = [[
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

local products = {}
products[123456] = function(player)
    player.leaderstats.Coins.Value += 100
    return true
end

MarketplaceService.ProcessReceipt = function(receipt)
    local player = Players:GetPlayerByUserId(receipt.PlayerId)
    if not player then return Enum.ProductPurchaseDecision.NotProcessedYet end
    local handler = products[receipt.ProductId]
    if not handler then return Enum.ProductPurchaseDecision.NotProcessedYet end
    local ok, granted = pcall(handler, player)
    if ok and granted then
        return Enum.ProductPurchaseDecision.PurchaseGranted
    end
    return Enum.ProductPurchaseDecision.NotProcessedYet
end
      ]]
    },
    {
      id = "gamepass_prompt_y_ownership",
      categoria = "Monetización",
      texto = "GamePass se vende con PromptGamePassPurchase y su posesión se verifica en el servidor con UserOwnsGamePassAsync, nunca en el cliente. En juegos con gamepasses de pago (Blox Fruits' Fruit Dealer, Adopt Me's Fly-A-Pet) la verificación se cachea en una tabla por sesión para no llamar la API en cada frame.",
      tags = { "GamePass", "UserOwnsGamePassAsync", "PromptGamePassPurchase" },
      ejemplo = [[
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local GAMEPASS_ID = 987654321
local cache = {}

local function ownsPass(player)
    if cache[player.UserId] ~= nil then return cache[player.UserId] end
    local ok, owns = pcall(MarketplaceService.UserOwnsGamePassAsync, MarketplaceService, player.UserId, GAMEPASS_ID)
    cache[player.UserId] = ok and owns or false
    return cache[player.UserId]
end

Players.PlayerAdded:Connect(function(player)
    if ownsPass(player) then
        player.Chatted:Connect(function(msg)
            if msg == "/fly" and player.Character then
                local hrp = player.Character:FindFirstChild("HumanoidRootPart")
                if hrp then
                    local bv = Instance.new("BodyVelocity")
                    bv.MaxForce = Vector3.new(1e5, 1e5, 1e5)
                    bv.Velocity = Vector3.new(0, 50, 0)
                    bv.Parent = hrp
                end
            end
        end)
    end
end)

Players.PlayerRemoving:Connect(function(player)
    cache[player.UserId] = nil
end)
      ]]
    },

    -- ===== MATCHMAKING Y CROSS-SERVER =====
    {
      id = "memorystore_matchmaking",
      categoria = "Matchmaking",
      texto = "MemoryStoreService + TeleportService se usan para matchmaking entre servidores (BedWars, Rivals, Blox Fruits raids). MemoryStore guarda colas compartidas; TeleportAsync mueve a los jugadores emparejados. Límite: 50 jugadores por TeleportAsync. Las colas tienen TTL; si un jugador no se empareja en ese tiempo, debe reinsertarse.",
      tags = { "MemoryStoreService", "TeleportService", "matchmaking" },
      ejemplo = [[
local MemoryStoreService = game:GetService("MemoryStoreService")
local TeleportService = game:GetService("TeleportService")
local queue = MemoryStoreService:GetQueue("RankedQueue")

local function enqueue(player)
    queue:AddAsync({ userId = player.UserId, elo = 1000 }, 60)
end

local function tryMatch()
    local items = queue:ReadAsync(2, false, 60)
    if #items < 2 then return end
    local players = {}
    for _, item in items do
        local p = game.Players:GetPlayerByUserId(item.userId)
        if p then table.insert(players, p) end
    end
    if #players >= 2 then
        TeleportService:TeleportAsync(1234567890, players)
    end
end
      ]]
    },
    {
      id = "messaging_cross_server",
      categoria = "Comunicación",
      texto = "MessagingService permite enviar mensajes entre servidores del mismo universo. Se usa para anuncios globales (caídas de meteoritos en Pet Simulator), eventos en vivo y coordinación de matchmaking. Límite aproximado de 1 mensaje por segundo por tema. Los datos se serializan a JSON: solo tipos primitivos y tablas.",
      tags = { "MessagingService", "cross-server", "eventos" },
      ejemplo = [[
local MessagingService = game:GetService("MessagingService")
local TOPIC = "GlobalEvent"

MessagingService:SubscribeAsync(TOPIC, function(message)
    print("Evento:", message.Data.type)
end)

task.spawn(function()
    while true do
        task.wait(30)
        MessagingService:PublishAsync(TOPIC, {
            type = "MeteorShower",
            serverId = game.JobId,
            timestamp = os.time()
        })
    end
end)
      ]]
    },
    {
      id = "reservedserver_privado",
      categoria = "Matchmaking",
      texto = "ReserveServer crea un servidor privado con un access code único. Se usa para partidas privadas, torneos y sesiones de clan (BedWars privadas, torneos de Blade Ball). El código se pasa a TeleportToPrivateServer junto con la lista de jugadores. El servidor reservado se destruye cuando todos salen.",
      tags = { "ReserveServer", "TeleportToPrivateServer", "privado" },
      ejemplo = [[
local TeleportService = game:GetService("TeleportService")

local function createPrivate(players)
    local code, id = TeleportService:ReserveServer(1234567890)
    TeleportService:TeleportToPrivateServer(1234567890, code, players)
    return id
end
      ]]
    },

    -- ===== INTERACCIÓN Y OBJETOS =====
    {
      id = "collection_tags",
      categoria = "Objetos",
      texto = "CollectionService permite etiquetar cualquier Instance. Se usa para identificar objetos interactivos (puertas, cofres, armas) sin recorrer el árbol. BedWars y Blade Ball lo usan para gestionar colecciones dinámicas. GetInstanceAddedSignal y GetInstanceRemovedSignal mantienen la lista sincronizada cuando el StreamingEnabled carga o descarga partes.",
      tags = { "CollectionService", "tags", "interacción" },
      ejemplo = [[
local CollectionService = game:GetService("CollectionService")
local TAG = "Chest"

local function onChest(chest)
    chest.Touched:Connect(function(hit)
        local player = game.Players:GetPlayerFromCharacter(hit.Parent)
        if player then
            CollectionService:RemoveTag(chest, TAG)
            chest:Destroy()
        end
    end)
end

for _, chest in CollectionService:GetTagged(TAG) do onChest(chest) end
CollectionService:GetInstanceAddedSignal(TAG):Connect(onChest)
      ]]
    },
    {
      id = "proximityprompt_interaccion",
      categoria = "Interacción",
      texto = "ProximityPrompt genera una interfaz contextual cuando el jugador se acerca a un objeto. Se usa para puertas, cofres, botones y estaciones de crafteo en BedWars, Blox Fruits y Grow a Garden. El evento Triggered se conecta en el servidor para validar la acción; el cliente solo ve el prompt.",
      tags = { "ProximityPrompt", "interacción", "Triggered" },
      ejemplo = [[
local prompt = script.Parent
prompt.ActionText = "Abrir"
prompt.ObjectText = "Cofre"
prompt.HoldDuration = 0.5

prompt.Triggered:Connect(function(player)
    player.leaderstats.Coins.Value += 50
    prompt.Parent:Destroy()
end)
      ]]
    },
    {
      id = "pathfinding_npc",
      categoria = "NPC",
      texto = "PathfindingService calcula rutas en la malla de navegación. Se usa para NPCs que persiguen jugadores o patrullan (enemigos en Dungeon Quest, mascotas que siguen en Adopt Me). Cada ComputeAsync recalcula la ruta; en persecuciones se recalcula cada 0.5-1 s, no cada frame. MoveTo mueve al Humanoid, MoveToFinished:Wait espera al waypoint.",
      tags = { "PathfindingService", "NPC", "IA" },
      ejemplo = [[
local PathfindingService = game:GetService("PathfindingService")
local npc = script.Parent
local humanoid = npc:WaitForChild("Humanoid")
local target = workspace:WaitForChild("Target")

local path = PathfindingService:CreatePath({
    AgentRadius = 2,
    AgentHeight = 5,
    AgentCanJump = true
})

task.spawn(function()
    while true do
        local ok = pcall(path.ComputeAsync, path, npc.HumanoidRootPart.Position, target.Position)
        if ok and path.Status == Enum.PathStatus.Success then
            for _, wp in path:GetWaypoints() do
                humanoid:MoveTo(wp.Position)
                humanoid.MoveToFinished:Wait()
            end
        end
        task.wait(0.5)
      ]]
    },

    -- ===== COMBATE, HABILIDADES Y ANIMACIÓN =====
    {
      id = "humanoid_combate_servidor",
      categoria = "Combate",
      texto = "El daño se aplica SIEMPRE desde el servidor con Humanoid:TakeDamage o cambiando Humanoid.Health. Juegos como BedWars y Blade Ball validan la distancia y la línea de visión del atacante antes de aplicar daño. Nunca confíes en el cliente para el hitbox ni el daño.",
      tags = { "Humanoid", "TakeDamage", "combate", "seguridad" },
      ejemplo = [[
local function hit(attacker, victim)
    if not victim or not victim:FindFirstChild("Humanoid") then return end
    local hrpA = attacker.Character and attacker.Character:FindFirstChild("HumanoidRootPart")
    local hrpV = victim:FindFirstChild("HumanoidRootPart")
    if not hrpA or not hrpV then return end
    if (hrpA.Position - hrpV.Position).Magnitude > 8 then return end
    victim.Humanoid:TakeDamage(25)
end
      ]]
    },
    {
      id = "tween_animacion_gui",
      categoria = "UI",
      texto = "TweenService:Create(objeto, TweenInfo.new(t, estilo, direccion), propiedadesDestino) es la forma estándar de animar GUI y partes. Para deslizar desde abajo: Position inicial fuera de pantalla a UDim2.fromScale(0.5, 0.5) con AnchorPoint centrado. Cancelar un tween con tween:Cancel() evita solapamientos.",
      tags = { "TweenService", "animación", "UI" },
      ejemplo = [[
local TweenService = game:GetService("TweenService")
local frame = script.Parent
frame.AnchorPoint = Vector2.new(0.5, 0.5)
frame.Position = UDim2.fromScale(0.5, 1.5)

local tween = TweenService:Create(
    frame,
    TweenInfo.new(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
    { Position = UDim2.fromScale(0.5, 0.5) }
)
tween:Play()
      ]]
    },
    {
      id = "animator_animaciones",
      categoria = "Animación",
      texto = "Animator:LoadAnimation (creado por el Humanoid) reproduce animaciones subidas a Roblox. En combate (Blade Ball, BedWars) la animación la dispara el servidor con un RemoteEvent para que todos los clientes la vean. Nunca cargues animaciones en cada ataque: guarda el AnimationTrack y usa :Play() y :Stop().",
      tags = { "Animator", "LoadAnimation", "combate" },
      ejemplo = [[
local remote = script.Parent
local animId = "rbxassetid://1234567890"

remote.OnServerEvent:Connect(function(player)
    local char = player.Character
    if not char then return end
    local hum = char:FindFirstChildOfClass("Humanoid")
    if not hum then return end
    local animator = hum:FindFirstChildOfClass("Animator")
    if not animator then return end
    local track = animator:LoadAnimation(Instance.new("Animation"))
    track.AnimationId = animId
    track:Play()
end)
      ]]
    },

    -- ===== CHAT, INPUT Y UI AVANZADA =====
    {
      id = "textchatservice_comandos",
      categoria = "Chat",
      texto = "TextChatService registra comandos con TextChatCommand (PrimaryAlias y SecondaryAlias). Triggered se conecta en el servidor para evitar exploits. Se usa para comandos de admin, emoteos y atajos en juegos como Blox Fruits y BedWars. Legacy Chat fue deprecado en 2024.",
      tags = { "TextChatService", "TextChatCommand", "comandos" },
      ejemplo = [[
local TextChatService = game:GetService("TextChatService")
local cmd = Instance.new("TextChatCommand")
cmd.Name = "EmoteWave"
cmd.PrimaryAlias = "/wave"
cmd.Parent = TextChatService

cmd.Triggered:Connect(function(_, source)
    local player = game.Players:GetPlayerByUserId(source.UserId)
    if player and player.Character then
        local hum = player.Character:FindFirstChildOfClass("Humanoid")
        if hum then
            local animator = hum:FindFirstChildOfClass("Animator")
            if animator then
                local track = animator:LoadAnimation(Instance.new("Animation"))
                track.AnimationId = "rbxassetid://507770239"
                track:Play()
            end
        end
    end
end)
      ]]
    },
    {
      id = "userinput_multiplataforma",
      categoria = "Input",
      texto = "UserInputService detecta teclado, ratón, táctil y gamepad. Para soportar móvil (la mayoría de jugadores de Roblox) se usa ContextActionService:BindAction, que abstrae la tecla, el botón y el toque táctil en una sola acción. InputBegan en UserInputService sirve para detectar pulsaciones sueltas, no para acciones de juego.",
      tags = { "UserInputService", "ContextActionService", "móvil" },
      ejemplo = [[
local ContextActionService = game:GetService("ContextActionService")

local function onJump(_, state)
    if state ~= Enum.UserInputState.Begin then return end
    local char = game.Players.LocalPlayer.Character
    if char then
        local hum = char:FindFirstChildOfClass("Humanoid")
        if hum then hum.Jump = true end
    end
end

ContextActionService:BindAction(
    "DoubleJump",
    onJump,
    true,
    Enum.KeyCode.Space,
    Enum.UserInputType.Touch
)
      ]]
    },
    {
      id = "ui_udim2_responsive",
      categoria = "UI",
      texto = "UDim2.new(XScale, XOffset, YScale, YOffset). Usa Scale (0-1) para tamaño relativo y Offset (px) para ajustes finos. Para centrar: AnchorPoint = Vector2.new(0.5, 0.5) y Position = UDim2.fromScale(0.5, 0.5). UIListLayout, UIPadding y UIGridLayout organizan sin posiciones manuales. UIScale ajusta toda la UI por dispositivo. Evita offsets fijos en móvil.",
      tags = { "UDim2", "UIListLayout", "UIScale", "responsive" },
      ejemplo = [[
local gui = Instance.new("ScreenGui")
gui.Parent = game.Players.LocalPlayer:WaitForChild("PlayerGui")

local frame = Instance.new("Frame")
frame.AnchorPoint = Vector2.new(0.5, 0.5)
frame.Position = UDim2.fromScale(0.5, 0.5)
frame.Size = UDim2.fromScale(0.6, 0.5)
frame.Parent = gui

local list = Instance.new("UIListLayout")
list.Padding = UDim.new(0, 8)
list.Parent = frame

local scale = Instance.new("UIScale")
scale.Scale = 1
scale.Parent = gui
      ]]
    },
    {
      id = "ui_eventos_correctos",
      categoria = "UI",
      texto = "En botones de GUI el evento correcto es MouseButton1Click o Activated. Touched solo existe en BasePart (mundo 3D). Visible solo existe en GuiObject; para ocultar una Part 3D se usa Transparency = 1. Un TextButton vive en un ScreenGui dentro de PlayerGui, no en workspace.",
      tags = { "MouseButton1Click", "Visible", "Transparency", "anti-patrón" }
    },

    -- ===== SERVICIOS DE INFRAESTRUCTURA =====
    {
      id = "runservice_bucles",
      categoria = "Servicios",
      texto = "RunService: Heartbeat (cada frame en servidor y cliente), PreRender (antes de render en cliente), RenderStepped (solo cliente, para cámara y UI por frame). task.wait es el reemplazo moderno de wait; task.spawn y task.delay los de spawn y delay. RenderStepped no debe usarse en servidor.",
      tags = { "RunService", "Heartbeat", "RenderStepped", "task.wait" }
    },
    {
      id = "getservice_obligatorio",
      categoria = "Servicios",
      texto = "Cada servicio se obtiene con game:GetService(\"Nombre\") una vez y se guarda en una variable. game.Nombre no es fiable y puede devolver nil durante la carga. Los servicios más usados en juegos profesionales: Players, ReplicatedStorage, ServerScriptService, ServerStorage, MarketplaceService, DataStoreService, TeleportService, MemoryStoreService, MessagingService, CollectionService, PathfindingService, TweenService, RunService, UserInputService, ContextActionService, TextChatService.",
      tags = { "GetService", "arquitectura", "servicios" }
    },
    {
      id = "seguridad_servidor_autoritativo",
      categoria = "Seguridad",
      texto = "Regla de oro: el cliente nunca es confiable. Compras, daño, inventario y posición final se validan en el servidor. Los RemoteEvents transportan intención, no resultados. RemoteFunction solo cuando el cliente necesita un valor de vuelta inmediato; nunca en bucles. Rate-limit los remotes por jugador para evitar spam.",
      tags = { "seguridad", "RemoteEvent", "RemoteFunction", "anti-cheat" },
      ejemplo = [[
local remote = script.Parent
local lastUse = {}

remote.OnServerEvent:Connect(function(player)
    local now = os.clock()
    if lastUse[player.UserId] and now - lastUse[player.UserId] < 1 then return end
    lastUse[player.UserId] = now
    player.leaderstats.Coins.Value += 10
end)
      ]]
    },
    {
      id = "streaming_enabled",
      categoria = "Rendimiento",
      texto = "StreamingEnabled reduce memoria y tiempos de carga en mapas grandes (Blox Fruits, Pet Simulator). Al activarlo, las partes lejanas no existen en el cliente hasta que se acercan, por lo que scripts de cliente deben esperar con WaitForChild. ModelStreamingBehavior y StreamingTargetRadius ajustan el comportamiento desde Workspace.",
      tags = { "StreamingEnabled", "rendimiento", "Workspace" }
    },
    {
      id = "physics_and_collision",
      categoria = "Física",
      texto = "Para detectar impactos se usan Touched, Raycast o GetPartBoundsInBox. Raycast es más preciso para armas y línea de visión; GetPartBoundsInBox para áreas. Los hitboxes de combate se hacen invisibles con Transparency = 1 y CanCollide = false, pero siguen siendo detectables. Nunca actives CanTouch en miles de partes: usa raycast.",
      tags = { "Raycast", "Touched", "GetPartBoundsInBox", "hitbox" }
    }
  }
}
