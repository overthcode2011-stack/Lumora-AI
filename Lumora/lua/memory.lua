return {
  version = 1,
  facts = {
    {
      id = "leaderstats_datastore_basico",
      categoria = "Datos",
      texto = "Leaderstats se crea en ServerScriptService. Se usa un Folder llamado \"leaderstats\" con IntValue dentro. Para guardar se usa DataStoreService con pcall y UpdateAsync para escrituras atómicas.",
      tags = { "leaderstats", "DataStoreService", "UpdateAsync" },
      ejemplo = [[
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local store = DataStoreService:GetDataStore("PlayerStats_v1")

local function loadData(player)
    local key = "Player_" .. player.UserId
    local leaderstats = Instance.new("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player

    local coins = Instance.new("IntValue")
    coins.Name = "Coins"
    coins.Value = 0
    coins.Parent = leaderstats

    local level = Instance.new("IntValue")
    level.Name = "Level"
    level.Value = 1
    level.Parent = leaderstats

    local success, data = pcall(function()
        return store:GetAsync(key)
    end)

    if success and data then
        coins.Value = data.Coins or 0
        level.Value = data.Level or 1
    end
end

local function saveData(player)
    local ls = player:FindFirstChild("leaderstats")
    if not ls then return end
    local key = "Player_" .. player.UserId
    pcall(function()
        store:UpdateAsync(key, function(old)
            old = old or {}
            old.Coins = ls.Coins.Value
            old.Level = ls.Level.Value
            return old
        end)
    end)
end

Players.PlayerAdded:Connect(loadData)
Players.PlayerRemoving:Connect(saveData)
game:BindToClose(function()
    for _, p in Players:GetPlayers() do
        task.spawn(saveData, p)
    end
    task.wait(3)
end)
      ]]
    },
    {
      id = "profileservice_estandar",
      categoria = "Datos",
      texto = "ProfileService es el estándar de 2025-2026 para guardado de datos en juegos grandes (Adopt Me, Blox Fruits, Pet Simulator). Implementa session locking: un perfil solo se carga en un servidor a la vez. Evita pérdida de datos en teleports y crashes.",
      tags = { "ProfileService", "session locking", "producción" },
      referencia = "github.com/MadStudioRoblox/ProfileService"
    },
    {
      id = "marketplace_processreceipt",
      categoria = "Monetización",
      texto = "MarketplaceService.ProcessReceipt se asigna UNA vez en un solo Script de servidor. Si se asigna dos veces, la segunda sobrescribe la primera y los productos anteriores dejan de funcionar. Debe devolver Enum.ProductPurchaseDecision.PurchaseGranted solo tras confirmar la entrega.",
      tags = { "MarketplaceService", "ProcessReceipt", "developer products" },
      ejemplo = [[
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

local productFunctions = {}
productFunctions[123456] = function(receipt, player)
    local coins = player.leaderstats.Coins
    coins.Value += 100
    return true
end

local function processReceipt(receiptInfo)
    local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
    if not player then return Enum.ProductPurchaseDecision.NotProcessedYet end
    local handler = productFunctions[receiptInfo.ProductId]
    if not handler then return Enum.ProductPurchaseDecision.NotProcessedYet end
    local success, result = pcall(handler, receiptInfo, player)
    if success and result then
        return Enum.ProductPurchaseDecision.PurchaseGranted
    end
    return Enum.ProductPurchaseDecision.NotProcessedYet
end

MarketplaceService.ProcessReceipt = processReceipt
      ]]
    },
    {
      id = "collection_tags",
      categoria = "Objetos",
      texto = "CollectionService permite etiquetar cualquier Instance. Se usa para identificar objetos interactivos (puertas, cofres, armas) sin recorrer el árbol. Juegos como BedWars y Blade Ball lo usan para gestionar colecciones dinámicas.",
      tags = { "CollectionService", "tags", "interacción" },
      ejemplo = [[
local CollectionService = game:GetService("CollectionService")
local TAG = "Chest"

local function onChestAdded(chest)
    if not chest:IsA("BasePart") then return end
    chest.Touched:Connect(function(hit)
        local player = game.Players:GetPlayerFromCharacter(hit.Parent)
        if player then
            CollectionService:RemoveTag(chest, TAG)
            chest:Destroy()
        end
    end)
end

for _, chest in CollectionService:GetTagged(TAG) do
    onChestAdded(chest)
end
CollectionService:GetInstanceAddedSignal(TAG):Connect(onChestAdded)
      ]]
    },
    {
      id = "memorystore_matchmaking",
      categoria = "Matchmaking",
      texto = "MemoryStoreService + TeleportService se usan para matchmaking entre servidores (BedWars, Rivals, Blox Fruits raids). MemoryStore guarda colas compartidas; TeleportAsync mueve a los jugadores emparejados. Límite: 50 jugadores por TeleportAsync.",
      tags = { "MemoryStoreService", "TeleportService", "matchmaking" },
      ejemplo = [[
local MemoryStoreService = game:GetService("MemoryStoreService")
local TeleportService = game:GetService("TeleportService")
local queue = MemoryStoreService:GetQueue("RankedQueue")

local function enqueue(player)
    local data = { userId = player.UserId, elo = 1000 }
    queue:AddAsync(data, 60)
end

local function tryMatch()
    local items = queue:ReadAsync(2, false, 60)
    if #items >= 2 then
        local players = {}
        for _, item in items do
            local p = game.Players:GetPlayerByUserId(item.userId)
            if p then table.insert(players, p) end
        end
        if #players >= 2 then
            local options = Instance.new("TeleportOptions")
            TeleportService:TeleportAsync(1234567890, players, options)
        end
    end
end
      ]]
    },
    {
      id = "messaging_cross_server",
      categoria = "Comunicación",
      texto = "MessagingService permite enviar mensajes entre servidores del mismo universo. Se usa para anuncios globales (caídas de meteoritos en Pet Simulator), eventos en vivo y coordinación de matchmaking. Límite de 1 mensaje por segundo por tema aproximadamente.",
      tags = { "MessagingService", "cross-server", "eventos" },
      ejemplo = [[
local MessagingService = game:GetService("MessagingService")
local TOPIC = "GlobalEvent"

MessagingService:SubscribeAsync(TOPIC, function(message)
    print("Evento recibido:", message.Data)
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
      id = "ordereddatastore_leaderboard",
      categoria = "Datos",
      texto = "OrderedDataStore guarda valores numéricos ordenables y se usa para leaderboards globales (top coins en Pet Simulator, top level en Blox Fruits). Se consulta con GetSortedAsync, nunca en cada frame.",
      tags = { "OrderedDataStore", "leaderboard", "GetSortedAsync" },
      ejemplo = [[
local DataStoreService = game:GetService("DataStoreService")
local board = DataStoreService:GetOrderedDataStore("TopCoins")

local function updateBoard(player)
    local coins = player.leaderstats.Coins.Value
    board:SetAsync(tostring(player.UserId), coins)
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
      id = "pathfinding_npc",
      categoria = "NPC",
      texto = "PathfindingService calcula rutas en la malla de navegación. Se usa para NPCs que persiguen jugadores o patrullan (enemigos en Dungeon Quest, mascotas que siguen en Adopt Me). Se crea un Path con CreatePath y se recorre con MoveTo.",
      tags = { "PathfindingService", "NPC", "IA" },
      ejemplo = [[
local PathfindingService = game:GetService("PathfindingService")
local npc = script.Parent
local humanoid = npc:WaitForChild("Humanoid")
local target = workspace:WaitForChild("TargetPart")

local function moveToTarget()
    local path = PathfindingService:CreatePath({
        AgentRadius = 2,
        AgentHeight = 5,
        AgentCanJump = true
    })
    local success, err = pcall(function()
        path:ComputeAsync(npc.HumanoidRootPart.Position, target.Position)
    end)
    if success and path.Status == Enum.PathStatus.Success then
        for _, waypoint in path:GetWaypoints() do
            humanoid:MoveTo(waypoint.Position)
            humanoid.MoveToFinished:Wait()
        end
    end
end
      ]]
    },
    {
      id = "proximityprompt_interaccion",
      categoria = "Interacción",
      texto = "ProximityPrompt genera una interfaz de interacción contextual cuando el jugador se acerca a un objeto. Se usa para puertas, cofres, botones y estaciones de crafteo. El evento Triggered se conecta en el servidor para validar la acción.",
      tags = { "ProximityPrompt", "interacción", "Triggered" },
      ejemplo = [[
local prompt = script.Parent
prompt.ActionText = "Abrir"
prompt.ObjectText = "Cofre"
prompt.HoldDuration = 0.5

prompt.Triggered:Connect(function(player)
    local coins = player.leaderstats.Coins
    coins.Value += 50
    script.Parent.Parent:Destroy()
end)
      ]]
    },
    {
      id = "textchatservice_comandos",
      categoria = "Chat",
      texto = "TextChatService permite registrar comandos de chat (por ejemplo \"/super\", \"/mini\"). Se crea un TextChatCommand dentro de TextChatService con PrimaryAlias y SecondaryAlias. El Triggered se conecta en el servidor para evitar exploits.",
      tags = { "TextChatService", "comandos", "TextChatCommand" },
      ejemplo = [[
local TextChatService = game:GetService("TextChatService")
local command = Instance.new("TextChatCommand")
command.Name = "SizeCommand"
command.PrimaryAlias = "/size"
command.SecondaryAlias = "/tamano"
command.Parent = TextChatService

command.Triggered:Connect(function(originalText, textSource)
    local player = game.Players:GetPlayerByUserId(textSource.UserId)
    if player and player.Character then
        local humanoid = player.Character:FindFirstChildWhichIsA("Humanoid")
        if humanoid then
            local size = originalText:lower():find("big") and 2 or 0.5
            humanoid.BodyDepthScale.Value = size
            humanoid.BodyWidthScale.Value = size
            humanoid.BodyHeightScale.Value = size
        end
    end
end)
      ]]
    }
  }
}
