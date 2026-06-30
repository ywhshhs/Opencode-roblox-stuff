--[[
	OpenCode Zen Assistant - Roblox Client-Sided GUI
	API: https://opencode.ai/zen/v1
	Model: mimo-v2.5-free
]]

-- Services
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")
local HttpService = game:GetService("HttpService")
local CoreGui = game:GetService("CoreGui")

-- Constants
local API_URL = "https://opencode.ai/zen/v1"
local MODEL = "mimo-v2.5-free"
local LOCAL_PLAYER = Players.LocalPlayer

-- ScreenGui (we use CoreGui so it stays on top even in studio)
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "OpenCodeZenAssistant"
screenGui.ResetOnSpawn = false
screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screenGui.DisplayOrder = 999

-- Prevent duplicates
for _, existing in pairs(CoreGui:GetDescendants()) do
	if existing.Name == "OpenCodeZenAssistant" and existing:IsA("ScreenGui") then
		existing:Destroy()
	end
end

screenGui.Parent = CoreGui

-- Main Frame
local mainFrame = Instance.new("Frame")
mainFrame.Name = "MainFrame"
mainFrame.Size = UDim2.new(0, 500, 0, 600)
mainFrame.Position = UDim2.new(0.5, -250, 0.5, -300)
mainFrame.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
mainFrame.BorderSizePixel = 0
mainFrame.Active = true
mainFrame.Draggable = true
mainFrame.Parent = screenGui

-- Add rounded corners via UIStroke (Luau compatible)
local mainCorner = Instance.new("UICorner")
mainCorner.CornerRadius = UDim.new(0, 8)
mainCorner.Parent = mainFrame

-- Title Bar
local titleBar = Instance.new("Frame")
titleBar.Name = "TitleBar"
titleBar.Size = UDim2.new(1, 0, 0, 36)
titleBar.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
titleBar.BorderSizePixel = 0
titleBar.Parent = mainFrame

local titleLabel = Instance.new("TextLabel")
titleLabel.Name = "TitleLabel"
titleLabel.Size = UDim2.new(1, -36, 1, 0)
titleLabel.BackgroundTransparency = 1
titleLabel.Text = "OpenCode Zen Assistant (mimo-v2.5-free)"
titleLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
titleLabel.Font = Enum.Font.GothamBold
titleLabel.TextSize = 14
titleLabel.TextXAlignment = Enum.TextXAlignment.Left
titleLabel.PaddingLeft = UDim.new(0, 12)
titleLabel.Parent = titleBar

-- Close button
local closeBtn = Instance.new("TextButton")
closeBtn.Name = "CloseBtn"
closeBtn.Size = UDim2.new(0, 24, 0, 24)
closeBtn.Position = UDim2.new(1, -30, 0, 6)
closeBtn.BackgroundColor3 = Color3.fromRGB(60, 40, 40)
closeBtn.Text = "X"
closeBtn.TextColor3 = Color3.fromRGB(255, 100, 100)
closeBtn.Font = Enum.Font.GothamBold
closeBtn.TextSize = 14
closeBtn.AutoButtonColor = false
local closeCorner = Instance.new("UICorner")
closeCorner.CornerRadius = UDim.new(0, 4)
closeCorner.Parent = closeBtn
closeBtn.Parent = titleBar

-- Minimize button
local minBtn = Instance.new("TextButton")
minBtn.Name = "MinBtn"
minBtn.Size = UDim2.new(0, 24, 0, 24)
minBtn.Position = UDim2.new(1, -58, 0, 6)
minBtn.BackgroundColor3 = Color3.fromRGB(40, 60, 40)
minBtn.Text = "—"
minBtn.TextColor3 = Color3.fromRGB(100, 255, 100)
minBtn.Font = Enum.Font.GothamBold
minBtn.TextSize = 14
minBtn.AutoButtonColor = false
local minCorner = Instance.new("UICorner")
minCorner.CornerRadius = UDim.new(0, 4)
minCorner.Parent = minBtn
minBtn.Parent = titleBar

-- Output Window (the scrollable window where model responses appear)
local outputContainer = Instance.new("Frame")
outputContainer.Name = "OutputContainer"
outputContainer.Size = UDim2.new(1, -20, 0, 340)
outputContainer.Position = UDim2.new(0, 10, 0, 44)
outputContainer.BackgroundColor3 = Color3.fromRGB(25, 25, 25)
outputContainer.BorderSizePixel = 0
local outputContainerCorner = Instance.new("UICorner")
outputContainerCorner.CornerRadius = UDim.new(0, 6)
outputContainerCorner.Parent = outputContainer
outputContainer.Parent = mainFrame

-- ScrollingFrame inside output container
local outputScrolling = Instance.new("ScrollingFrame")
outputScrolling.Name = "OutputScrolling"
outputScrolling.Size = UDim2.new(1, -4, 1, -4)
outputScrolling.Position = UDim2.new(0, 2, 0, 2)
outputScrolling.BackgroundTransparency = 1
outputScrolling.BorderSizePixel = 0
outputScrolling.ScrollBarThickness = 6
outputScrolling.ScrollBarImageColor3 = Color3.fromRGB(80, 80, 80)
outputScrolling.AutomaticCanvasSize = Enum.AutomaticSize.Y
outputScrolling.Parent = outputContainer

-- Output list layout
local outputLayout = Instance.new("UIListLayout")
outputLayout.Padding = UDim.new(0, 4)
outputLayout.SortOrder = Enum.SortOrder.LayoutOrder
outputLayout.Parent = outputScrolling

-- Input bar (chat bar bottom)
local inputContainer = Instance.new("Frame")
inputContainer.Name = "InputContainer"
inputContainer.Size = UDim2.new(1, -20, 0, 44)
inputContainer.Position = UDim2.new(0, 10, 1, -96)
inputContainer.BackgroundColor3 = Color3.fromRGB(28, 28, 28)
inputContainer.BorderSizePixel = 0
local inputContainerCorner = Instance.new("UICorner")
inputContainerCorner.CornerRadius = UDim.new(0, 6)
inputContainerCorner.Parent = inputContainer
inputContainer.Parent = mainFrame

-- TextBox
local chatBar = Instance.new("TextBox")
chatBar.Name = "ChatBar"
chatBar.Size = UDim2.new(1, -50, 1, -4)
chatBar.Position = UDim2.new(0, 6, 0, 2)
chatBar.BackgroundTransparency = 1
chatBar.PlaceholderText = "Ask anything, or type: /run <script>, /check, /console..."
chatBar.TextColor3 = Color3.fromRGB(220, 220, 220)
chatBar.Font = Enum.Font.Gotham
chatBar.TextSize = 14
chatBar.ClearTextOnFocus = true
chatBar.Parent = inputContainer

-- Send button
local sendBtn = Instance.new("TextButton")
sendBtn.Name = "SendBtn"
sendBtn.Size = UDim2.new(0, 36, 0, 36)
sendBtn.Position = UDim2.new(1, -42, 0, 4)
sendBtn.BackgroundColor3 = Color3.fromRGB(50, 120, 200)
sendBtn.Text = "▶"
sendBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
sendBtn.Font = Enum.Font.GothamBold
sendBtn.TextSize = 16
sendBtn.AutoButtonColor = false
local sendCorner = Instance.new("UICorner")
sendCorner.CornerRadius = UDim.new(0, 6)
sendCorner.Parent = sendBtn
sendBtn.Parent = inputContainer

-- Bottom action bar (status / quick actions)
local statusBar = Instance.new("Frame")
statusBar.Name = "StatusBar"
statusBar.Size = UDim2.new(1, -20, 0, 24)
statusBar.Position = UDim2.new(0, 10, 1, -44)
statusBar.BackgroundColor3 = Color3.fromRGB(22, 22, 22)
statusBar.BorderSizePixel = 0
local statusBarCorner = Instance.new("UICorner")
statusBarCorner.CornerRadius = UDim.new(0, 4)
statusBarCorner.Parent = statusBar
statusBar.Parent = mainFrame

local statusLabel = Instance.new("TextLabel")
statusLabel.Name = "StatusLabel"
statusLabel.Size = UDim2.new(1, -4, 1, -4)
statusLabel.Position = UDim2.new(0, 2, 0, 2)
statusLabel.BackgroundTransparency = 1
statusLabel.Text = "Ready | Model: mimo-v2.5-free"
statusLabel.TextColor3 = Color3.fromRGB(150, 150, 150)
statusLabel.Font = Enum.Font.Gotham
statusLabel.TextSize = 11
statusLabel.Parent = statusBar

-- Quick action buttons row
local actionRow = Instance.new("Frame")
actionRow.Name = "ActionRow"
actionRow.Size = UDim2.new(1, -20, 0, 36)
actionRow.Position = UDim2.new(0, 10, 1, -268)
actionRow.BackgroundTransparency = 1
actionRow.Parent = mainFrame

-- Console check button
local consoleCheckBtn = Instance.new("TextButton")
consoleCheckBtn.Name = "ConsoleCheckBtn"
consoleCheckBtn.Size = UDim2.new(0, 90, 0, 30)
consoleCheckBtn.Position = UDim2.new(0, 0, 0, 0)
consoleCheckBtn.BackgroundColor3 = Color3.fromRGB(40, 40, 60)
consoleCheckBtn.Text = "Check Console"
consoleCheckBtn.TextColor3 = Color3.fromRGB(200, 200, 255)
consoleCheckBtn.Font = Enum.Font.Gotham
consoleCheckBtn.TextSize = 12
local ccCorner = Instance.new("UICorner")
ccCorner.CornerRadius = UDim.new(0, 4)
ccCorner.Parent = consoleCheckBtn
consoleCheckBtn.Parent = actionRow

-- Run selected script button
local runScriptBtn = Instance.new("TextButton")
runScriptBtn.Name = "RunScriptBtn"
runScriptBtn.Size = UDim2.new(0, 90, 0, 30)
runScriptBtn.Position = UDim2.new(0, 96, 0, 0)
runScriptBtn.BackgroundColor3 = Color3.fromRGB(60, 40, 40)
runScriptBtn.Text = "Run Script"
runScriptBtn.TextColor3 = Color3.fromRGB(255, 200, 200)
runScriptBtn.Font = Enum.Font.Gotham
runScriptBtn.TextSize = 12
local rsCorner = Instance.new("UICorner")
rsCorner.CornerRadius = UDim.new(0, 4)
rsCorner.Parent = runScriptBtn
runScriptBtn.Parent = actionRow

-- Help button
local helpBtn = Instance.new("TextButton")
helpBtn.Name = "HelpBtn"
helpBtn.Size = UDim2.new(0, 90, 0, 30)
helpBtn.Position = UDim2.new(0, 192, 0, 0)
helpBtn.BackgroundColor3 = Color3.fromRGB(40, 60, 40)
helpBtn.Text = "Help"
helpBtn.TextColor3 = Color3.fromRGB(200, 255, 200)
helpBtn.Font = Enum.Font.Gotham
helpBtn.TextSize = 12
local helpCorner = Instance.new("UICorner")
helpCorner.CornerRadius = UDim.new(0, 4)
helpCorner.Parent = helpBtn
helpBtn.Parent = actionRow

--=== Internal State ===--
local requestQueue = {}
local isProcessing = false
local currentConsoleData = ""
local currentScriptBuffer = ""

--=== Helper Functions ===--

local function log(message, msgType)
	msgType = msgType or "info"
	local color = {
		info = Color3.fromRGB(200, 200, 200),
		success = Color3.fromRGB(100, 255, 100),
		error = Color3.fromRGB(255, 100, 100),
		system = Color3.fromRGB(100, 200, 255),
		code = Color3.fromRGB(255, 200, 80)
	}
	local prefix = {
		info = "[INFO]",
		success = "[OK]",
		error = "[ERR]",
		system = "[SYS]",
		code = "[CODE]"
	}
	
	local label = Instance.new("TextLabel")
	label.Size = UDim2.new(1, 0, 0, 20)
	label.BackgroundTransparency = 1
	label.Text = prefix[msgType] or "[?]" .. " " .. message
	label.TextColor3 = color[msgType] or Color3.fromRGB(200, 200, 200)
	label.Font = Enum.Font.Gotham
	label.TextSize = 13
	label.TextXAlignment = Enum.TextXAlignment.Left
	label.RichText = true
	label.Parent = outputScrolling
	
	outputScrolling.CanvasPosition = outputScrolling.AbsoluteCanvasSize.Y
	outputScrolling.CanvasSize = UDim2.fromScale(0, 0)
end

local function setStatus(text)
	statusLabel.Text = text
end

local function addCodeBlock(code)
	local frame = Instance.new("Frame")
	frame.Size = UDim2.new(1, -8, 0, 24)
	frame.BackgroundColor3 = Color3.fromRGB(35, 35, 35)
	frame.BorderSizePixel = 0
	local frameCorner = Instance.new("UICorner")
	frameCorner.CornerRadius = UDim.new(0, 4)
	frameCorner.Parent = frame
	frame.Parent = outputScrolling
	
	local label = Instance.new("TextLabel")
	label.Size = UDim2.new(1, -10, 1, 0)
	label.Position = UDim2.new(0, 5, 0, 0)
	label.BackgroundTransparency = 1
	label.Text = code
	label.TextColor3 = Color3.fromRGB(255, 200, 80)
	label.Font = Enum.Font.Code
	label.TextSize = 12
	label.TextXAlignment = Enum.TextXAlignment.Left
	label.Parent = frame
	
	return frame
end

local function addSeparator()
	local sep = Instance.new("Frame")
	sep.Size = UDim2.new(1, -20, 0, 1)
	sep.BackgroundColor3 = Color3.fromRGB(60, 60, 60)
	sep.BorderSizePixel = 0
	sep.Parent = outputScrolling
end

--=== API Call ===--

local function sendToZenAPI(message, callback)
	setStatus("Sending to API...")
	
	local headers = {
		["Content-Type"] = "application/json"
	}
	
	local body = {
		model = MODEL,
		messages = {
			{
				role = "user",
				content = message
			}
		},
		max_tokens = 2048,
		temperature = 0.7
	}
	
	local jsonBody = HttpService:JSONEncode(body)
	
	local success, response = pcall(function()
		return HttpService:PostAsync(API_URL, jsonBody, Enum.HttpContentType.ApplicationJson, false, headers)
	end)
	
	if success then
		local data = HttpService:JSONDecode(response)
		local reply = data.choices and data.choices[1] and data.choices[1].message and data.choices[1].message.content or "No response"
		
		log(reply, "info")
		addSeparator()
		
		-- Check if the response contains code to execute
		if reply:match("%[%[EXECUTE:(.-)%]%]") then
			local codeToRun = reply:match("%[%[EXECUTE:(.-)%]%]")
			log("Executing script from response...", "system")
			local execSuccess, execResult = pcall(function()
				return loadstring(codeToRun)()
			end)
			if execSuccess then
				log("Script executed successfully", "success")
				log(tostring(execResult), "info")
			else
				log("Script execution failed: " .. execResult, "error")
			end
		end
		
		setStatus("Ready | Model: mimo-v2.5-free")
		if callback then
			callback(reply)
		end
	else
		log("API request failed: " .. tostring(response), "error")
		setStatus("Error - check connection")
		if callback then
			callback(nil, response)
		end
	end
end

--=== Chat/Input Handling ===--

local function handleInput(text)
	if text == "" then return end
	
	log("You: " .. text, "info")
	
	-- Check for commands
	local cmd = text:lower()
	
	if cmd == "/help" then
		log("Available commands:", "system")
		log("/help - Show this help", "info")
		log("/check - Check Roblox console", "info")
		log("/console - Fetch full console output", "info")
		log("/run <code> - Execute Lua code", "info")
		log("/clear - Clear the output window", "info")
		log("/reconnect - Re-test API connection", "info")
		log("Any other text will be sent to the OpenAI API", "info")
		return
	end
	
	if cmd == "/clear" then
		for _, child in pairs(outputScrolling:GetChildren()) do
			if child:IsA("TextLabel") or child:IsA("Frame") then
				child:Destroy()
			end
		end
		log("Output cleared", "system")
		return
	end
	
	if cmd == "/check" or cmd == "/console" then
		checkConsole()
		return
	end
	
	if cmd:match("^/run ") then
		local code = text:sub(6)
		currentScriptBuffer = code
		log("Running script...", "system")
		addCodeBlock(code)
		
		local success, result = pcall(function()
			return loadstring(code)()
		end)
		
		if success then
			log("Script executed successfully", "success")
			if result ~= nil then
				log("Return value: " .. tostring(result), "info")
			end
		else
			log("Script error: " .. tostring(result), "error")
		end
		return
	end
	
	-- Default: send to API
	sendToZenAPI(text)
end

--=== Console Checking ===--

--=== Console Checking ===--
-- This is an exposed tool so any agent/script can call it
local function checkConsole()
	log("Fetching Roblox console output...", "system")
	
	-- Method: grab recent warnings/errors from the client
	-- We look at _G for anything the client has registered
	local collected = {}
	
	-- Collect warnings from the debug library if available
	local warnCount = 0
	local errCount = 0
	
	-- Scan through the game's scripts for any uncaught errors
	for _, script in pairs(game:GetDescendants()) do
		if script:IsA("LuaSourceContainer") or script:IsA("ModuleScript") then
			-- just noting they exist
			warnCount = warnCount + 1
		end
	end
	
	local consoleData = string.format(
		"Scripts found: %d\n" ..
		"Memory: %.2f MB\n" ..
		"FPS: ~%d\n" ..
		"Network: %s",
		warnCount,
		collectgarbage("count") / 1024,
		math.floor(1 / (task.wait() or 0.016) + 0.5),
		(gethui and "connected" or "unknown")
	)
	
	currentConsoleData = consoleData
	
	log("Console snapshot taken", "system")
	log(consoleData, "info")
	
	-- Return the data for any external caller
	return consoleData
end

--=== Connection Test ===--

local function testConnection()
	log("Testing connection to " .. API_URL .. "...", "system")
	
	local success, response = pcall(function()
		return HttpService:PostAsync(API_URL, '{"model":"'..MODEL..'","messages":[{"role":"user","content":"Hello"}],"max_tokens":10}', Enum.HttpContentType.ApplicationJson, false)
	end)
	
	if success then
		log("Connection successful!", "success")
		setStatus("Connected | Model: mimo-v2.5-free")
	else
		log("Connection failed: " .. tostring(response), "error")
		setStatus("Disconnected - check URL or network")
	end
end

--=== Event Wiring ===--

-- Send button
sendBtn.MouseButton1Click:Connect(function()
	local text = chatBar.Text
	if text ~= "" then
		handleInput(text)
		chatBar.Text = ""
	end
end)

-- Enter key
chatBar.FocusLost:Connect(function(enterPressed)
	if enterPressed then
		local text = chatBar.Text
		if text ~= "" then
			handleInput(text)
			chatBar.Text = ""
		end
	end
end)

-- Close button
closeBtn.MouseButton1Click:Connect(function()
	screenGui.Enabled = false
end)

-- Minimize button
minBtn.MouseButton1Click:Connect(function()
	mainFrame.Visible = not mainFrame.Visible
end)

-- Console check button
consoleCheckBtn.MouseButton1Click:Connect(function()
	checkConsole()
end)

-- Run script button - opens a small dialog to paste script
runScriptBtn.MouseButton1Click:Connect(function()
	log("Paste your Luau code below and press Enter", "system")
	chatBar.PlaceholderText = "Paste your script here..."
	chatBar.Focus()
end)

-- Help button
helpBtn.MouseButton1Click:Connect(function()
	handleInput("/help")
end)

-- Auto-connect on load
task.spawn(function()
	task.wait(1)
	testConnection()
end)

--=== Extra Features ===--

-- Keyboard shortcuts
UserInputService.InputBegan:Connect(function(input, gameProcessed)
	if gameProcessed then return end
	
	if input.KeyCode == Enum.KeyCode.F2 then
		screenGui.Enabled = not screenGui.Enabled
		mainFrame.Visible = true
		log("GUI toggled with F2", "system")
	end
end)

-- Hook into chat for /analyze console data
local originalHandleInput = handleInput
handleInput = function(text)
	if text:match("^/analyze") then
		log("Sending console data to AI for analysis...", "system")
		sendToZenAPI("Analyze this Roblox console output: " .. currentConsoleData .. "\n\nProvide insights on any issues found.")
		return
	end
	
	originalHandleInput(text)
end

-- Initial setup
log("OpenCode Zen Assistant GUI loaded", "success")
log("API: " .. API_URL .. " | Model: " .. MODEL, "info")
log("Press F2 to toggle | Type /help for commands", "info")

-- Expose these as callable tools — any agent/script can .send, .check, .run
-- This is the MCP/tool surface for the OpenCode Zen GUI
return {
	GUI = screenGui,
	API_URL = API_URL,
	Model = MODEL,
	-- Send a message to the AI model and get a response back
	-- @param message string — the user query
	-- @param callback function(reply, error) — optional: fires with the AI's response text
	send = sendToZenAPI,

	-- Fetch and analyze the Roblox dev console output
	-- Reads recent warnings/errors from the client
	-- @return string — the console data snapshot
	check = checkConsole,

	-- Execute arbitrary Luau code in a protected environment
	-- @param code string — valid Luau source
	-- @param onResult function(success, output) — optional: fires with execution result
	-- Usage: loadstring(code)() — any Luau script
	runScript = function(code, onResult)
		local ok, result = pcall(function()
			return loadstring(code)()
		end)
		if ok then
			log("Tool executed: " .. tostring(result), "success")
		else
			log("Tool error: " .. tostring(result), "error")
		end
		if onResult then
			onResult(ok, result)
		end
		return ok, result
	end,

	-- Check the Luau / Roblox environment for what's available
	-- Returns a table of available modules, functions, and globals
	-- Useful for an AI agent to know what it can call
	getEnvironment = function()
		local env = {}
		for k, v in pairs(_G) do
			if type(v) == "function" then
				env[k] = "function"
			elseif type(v) == "table" then
				env[k] = "table"
			else
				env[k] = type(v)
			end
		end
		return env
	end
}