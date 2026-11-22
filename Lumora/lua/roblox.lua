-- Fichas de Roblox y Luau: orden de carga, servidor/cliente, errores y bugs dificiles.
-- Formato igual que knowledge.lua (textos entre comillas simples, sin comillas simples dentro).
return {
  {
    id = "roblox-orden-carga",
    tags = "orden|carga|cargar|carga|primero|despues|replicatedfirst|loaded|isloaded|arranque|startup|inicia|inicio|ejecuta|ejecuta|antes",
    text = 'ORDEN DE CARGA EN ROBLOX (de primero a ultimo):
1) El SERVIDOR arranca primero (el servidor siempre va primero; el cliente espera su turno): carga el lugar y ejecuta los Script (ServerScriptService, Workspace). ServerStorage y ServerScriptService nunca se envian a los clientes.
2) Un jugador se conecta: su CLIENTE empieza a recibir el contenido (replicacion): Workspace, ReplicatedStorage, ReplicatedFirst, StarterGui, StarterPack.
3) En el cliente corren primero los LocalScript de ReplicatedFirst (antes de que cargue lo demas; ideal para pantallas de carga: ReplicatedFirst:RemoveDefaultLoadingScreen()).
4) Despues llega el resto del juego: game:IsLoaded() y game.Loaded avisan de que termino.
5) Al entrar el jugador: StarterPlayerScripts se copian a PlayerScripts y StarterGui a PlayerGui (otra vez en cada reaparicion si ResetOnSpawn = true).
6) Al aparecer el personaje: StarterCharacterScripts se copian al personaje y se dispara CharacterAdded.
El orden entre scripts del mismo sitio NO esta garantizado: no dependas de que uno corra antes que otro; usa ModuleScript, WaitForChild o eventos.'
  },
  {
    id = "roblox-servidor-cliente",
    tags = "servidor|cliente|server|client|replicacion|replicar|filteringenabled|localscript|autoridad|runcontext|isserver|isclient|lado|lados",
    text = 'SERVIDOR PRIMERO, CLIENTE DESPUES (regla de oro):
- El servidor es la autoridad: existe antes que cualquier cliente y decide lo que es verdad. El cliente llega despues y debe esperar a recibir las cosas (WaitForChild).
- Replicacion: servidor -> cliente si; cliente -> servidor NO (salvo su propio personaje, su entrada y los RemoteEvents). Un cambio en un LocalScript solo lo ve ese jugador.
- Script = servidor (ServerScriptService, Workspace). LocalScript = cliente (PlayerGui, PlayerScripts, Backpack, personaje, ReplicatedFirst). ModuleScript corre en el lado que lo require, con su propia copia.
- El cliente pide y el servidor decide: RemoteEvent:FireServer() -> OnServerEvent (valida todo). El servidor avisa: FireClient / FireAllClients -> OnClientEvent.
- Solo servidor: DataStoreService, ServerStorage, HttpService, MessagingService. Solo cliente: UserInputService, camara, PlayerGui, RenderStepped.
- Saber donde corres: RunService:IsServer() / RunService:IsClient().
Para recordarlo: el servidor siempre va primero; el cliente espera su turno.'
  },
  {
    id = "roblox-esperar",
    tags = "waitforchild|esperar|espera|replicado|streaming|streamingenabled|playeradded|characteradded|primera|nil|existe|todavia",
    text = 'ESPERAR A QUE ALGO CARGUE (evita casi todos los nil):
- Cliente, para lo que viene del servidor: local gui = player:WaitForChild("PlayerGui") ; local ev = game.ReplicatedStorage:WaitForChild("Compra", 10)
- Esperar el juego completo: if not game:IsLoaded() then game.Loaded:Wait() end
- Personaje: local char = player.Character or player.CharacterAdded:Wait()
- PlayerAdded en el servidor: un Script puede arrancar DESPUES de que alguien entro. Recorre tambien a los ya conectados:
  for _, p in ipairs(Players:GetPlayers()) do alEntrar(p) end
  Players.PlayerAdded:Connect(alEntrar)
- Con StreamingEnabled, partes lejanas pueden no existir aun en el cliente: usa WaitForChild con tiempo limite.
- require() de un ModuleScript corre UNA vez por lado y guarda el resultado.'
  },
  {
    id = "roblox-debug-metodo",
    tags = "error|errores|depurar|debug|corregir|arreglar|output|consola|falla|fallo|bug|diagnostico|traceback|corrige|arregla",
    text = 'COMO CORREGIR UN ERROR EN ROBLOX (metodo):
1. Lee el Output: Ruta.Script:LINEA: mensaje. La ruta dice DONDE corre (ServerScriptService = servidor; PlayerGui / PlayerScripts = cliente). La linea dice QUE mirar.
2. Identifica el tipo: sintaxis (el script ni arranca), nil (algo no existe aun), tipo incorrecto, o lado equivocado (servidor/cliente).
3. Piensa en el ORDEN: existe ya ese objeto cuando corre esa linea? Si viene del servidor y estas en un LocalScript, usa WaitForChild.
4. Arregla lo minimo y explica la causa. Prueba con print() antes y despues de la linea que falla.
5. Si no hay error pero algo no pasa: revisa que el script este en el lugar correcto (un Script no corre en StarterGui), que no este Disabled y que el evento se conecte ANTES de dispararse.
Respuesta ideal: Causa (1 frase) + codigo corregido completo + por que funciona.'
  },
  {
    id = "roblox-errores-comunes",
    tags = "attempt|index|member|valid|yield|infinite|call|arithmetic|compare|concatenate|expected|syntax|sintaxis|argument|cast|recursion|timeout|require|errores",
    text = 'ERRORES COMUNES (causa -> arreglo):
- attempt to index nil with "X": lo que esta antes del punto es nil. Aun no existe, esta mal escrito o esta en el otro lado. -> WaitForChild o if obj then.
- "X is not a valid member of Y": nombre mal escrito (importan las mayusculas) o aun no replicado. -> Y:WaitForChild("X").
- Infinite yield possible on "X": WaitForChild nunca encuentra a X. -> revisa nombre, padre y lado; pon tiempo limite.
- attempt to call a nil value: funcion inexistente, typo, modulo que no devuelve nada, o "." en vez de ":" (obj:Metodo()).
- attempt to perform arithmetic on nil/string: valor nil o texto. -> inicializalo o usa tonumber().
- Expected "end" ... got <eof>: falta un end. Todo function/if/for/while/do cierra con end.
- Unable to assign property X. Type expected: tipo incorrecto (Color3 vs BrickColor, Vector3 vs numero).
- Script timeout: exhausted allowed execution time: bucle sin task.wait().
- Stack overflow: funcion que se llama a si misma sin parar.
- Requested module was required recursively: dos ModuleScripts se requieren entre si.'
  },
  {
    id = "roblox-bugs-dificiles",
    tags = "dificil|dificiles|avanzado|carrera|condicion|race|fuga|memoria|leak|desconectar|disconnect|debounce|duplicado|veces|intermitente|respawn|reaparecer|lento|lag",
    text = 'BUGS DIFICILES (sin error claro):
- Funciona a veces: condicion de carrera. El codigo corre antes de que algo exista. -> WaitForChild, eventos (CharacterAdded:Wait()), nunca wait(1) a ciegas.
- PlayerAdded no corre para el primer jugador: el Script arranco tarde. -> recorre Players:GetPlayers() ademas de conectar PlayerAdded.
- Se ejecuta varias veces o da puntos duplicados: Touched se dispara muchas veces. -> debounce (local activo = false) o tabla de jugadores ya procesados.
- Se vuelve lento con el tiempo: conexiones sin desconectar. -> local c = evento:Connect(f) ... c:Disconnect().
- Tras reaparecer deja de funcionar: guardas el personaje viejo. -> vuelve a tomarlo en CharacterAdded.
- table.remove dentro de un for: recorre al reves (for i = #t, 1, -1 do).
- Un Instance enviado por RemoteEvent llega nil: el cliente aun no lo tiene (replicacion o StreamingEnabled).
- Bucles pesados cada frame: cachea referencias, no crees objetos ni busques con FindFirstChild repetido.
- Algo debe esperar sin frenar el resto: task.spawn(function() ... task.wait() ... end).'
  },
  {
    id = "luau-avanzado",
    tags = "luau|tipos|type|strict|metatable|metatabla|clase|oop|closure|pcall|xpcall|coroutine|corrutina|task|format|clone|freeze|continue|diferencias|lua",
    text = 'LUAU AVANZADO:
- Tipos opcionales: local n: number = 5 ; function suma(a: number, b: number): number. Con --!strict al inicio se activa el chequeo.
- Extras: += -= ..= //= ; continue en bucles ; if como expresion: local x = if a then 1 else 2.
- Errores controlados: local ok, res = pcall(function() ... end) ; if not ok then warn(res) end. xpcall(f, debug.traceback) da el rastro.
- Tablas: table.insert, table.remove, table.find, table.sort(t, function(a, b) return a > b end), table.concat(t, ","), table.clone, table.freeze. Indices desde 1; # cuenta solo secuencias sin huecos (ipairs se detiene en nil).
- Textos: string.format("%d jugadores", n), s:sub(1, 3), s:split(","), s:gsub("a", "b"). typeof() para tipos de Roblox (Vector3, Instance) y type() para los basicos.
- Clase simple: local C = {} ; C.__index = C ; function C.new(x) return setmetatable({x = x}, C) end ; function C:Mostrar() print(self.x) end
- Hilos: task.spawn(f), task.defer(f), task.delay(2, f), task.wait(), task.cancel(hilo). No uses wait, spawn ni delay antiguos.
- Luau es Lua 5.1 mejorado: no hay goto ni operadores de bits de 5.3; usa bit32.'
  },
  {
    id = "roblox-runservice-orden",
    tags = "heartbeat|stepped|renderstepped|runservice|prerender|presimulation|postsimulation|fisica|dt|deltatime|frame",
    text = 'ORDEN DE CADA FRAME (RunService):
PreRender (RenderStepped, solo cliente) -> PreAnimation -> PreSimulation (Stepped) -> fisica -> PostSimulation (Heartbeat).
- Heartbeat: despues de la fisica; vale para servidor y cliente: RunService.Heartbeat:Connect(function(dt) ... end).
- RenderStepped / PreRender: antes de dibujar; solo cliente; ideal para camara. No hagas trabajo pesado aqui.
- Stepped / PreSimulation: antes de la fisica; para mover cosas fisicas.
- Multiplica los movimientos por dt (segundos desde el frame anterior) para que no dependan de los FPS.
- RunService:IsServer() / :IsClient() / :IsStudio() dicen donde corre el codigo.'
  },
  {
    id = "roblox-modulos",
    tags = "modulescript|modulo|modulos|require|compartir|cyclic|ciclico",
    text = 'MODULESCRIPTS:
- Devuelven UNA cosa (normalmente una tabla): local M = {} ; function M.Suma(a, b) return a + b end ; return M
- require(ruta) corre el modulo una sola vez por lado (servidor o cliente) y guarda el resultado: todos los que lo requieren comparten esa tabla en ese lado.
- Servidor y cliente tienen copias separadas: el estado NO se comparte entre lados.
- Donde ponerlos: ReplicatedStorage si los usan los dos lados; ServerStorage o ServerScriptService si son solo del servidor (el cliente nunca los ve).
- Evita el require circular (A requiere B y B requiere A): da error. Mueve lo compartido a un tercer modulo.
- Si el modulo no devuelve nada: attempt to call a nil value al usarlo.'
  }
}
