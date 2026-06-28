--[[
    Elements.lua — Nova UI Framework
    All UI widgets: Window, Page, Section, Toggle, Slider, Button,
    Dropdown, Label, Textbox, Colorpicker, Keybind, Notification.
    Every widget follows: create → FadeDescendants → holder swap → debounce
]]

local Nova = require(script.Parent.Core)

--====================================================================--
--  Window
--====================================================================--
function Nova:Window(params)
    params = params or {}
    local w = { Items = {}, IsOpen = true, Pages = {} }
    local i = {}

    -- Main frame
    i.Main = Nova:Create("Frame", {
        Name = "\0",
        BackgroundColor3 = Nova.Theme.Background,
        Size = UDim2.new(0, 552, 0, 451),
        Position = UDim2.new(0.5, 0, 0.5, 0),
        AnchorPoint = Vector2.new(0.5, 0.5),
        BorderSizePixel = 0,
    })
    Nova:AddTheme(i.Main, { BackgroundColor3 = "Background" })

    -- Outline
    local stroke = Nova:Create("UIStroke", { Color = Nova.Theme.Outline,
        ApplyStrokeMode = Enum.ApplyStrokeMode.Border, })
    Nova:AddTheme(stroke, { Color = "Outline" })

    -- Border stroke (offset)
    local borderStroke = Nova:Create("UIStroke", { Color = Nova.Theme.Border,
        ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
        BorderOffset = UDim.new(0, 1), })
    Nova:AddTheme(borderStroke, { Color = "Border" })

    -- Accent line
    local accent = Nova:Create("Frame", {
        BackgroundColor3 = Nova.Theme.Accent,
        Size = UDim2.new(1, 0, 0, 1),
        BorderSizePixel = 0,
    })

    -- Pages bar
    i.PagesBar = Nova:Create("Frame", {
        Position = UDim2.new(0, 10, 0, 11),
        Size = UDim2.new(1, -20, 0, Nova.TabH),
        BorderSizePixel = 0,
        BackgroundColor3 = Nova.Theme.Border,
    })

    i.PagesInner = Nova:Create("Frame", {
        Parent = i.PagesBar,
        Position = UDim2.new(0, 1, 0, 1),
        Size = UDim2.new(1, -2, 1, -2),
        BorderSizePixel = 0,
        BackgroundColor3 = Nova.Theme.Section,
    })

    local pagesLayout = Instance.new("UIListLayout")
    pagesLayout.FillDirection = Enum.FillDirection.Horizontal
    pagesLayout.HorizontalFlex = Enum.UIFlexAlignment.Fill
    pagesLayout.Padding = UDim.new(0, 1)
    pagesLayout.SortOrder = Enum.SortOrder.LayoutOrder

    local pagesPad = Instance.new("UIPadding")
    pagesPad.PaddingTop = UDim.new(0, 1)
    pagesPad.PaddingBottom = UDim.new(0, 1)
    pagesPad.PaddingRight = UDim.new(0, 1)
    pagesPad.PaddingLeft = UDim.new(0, 1)

    -- Content area
    i.ContentOut = Nova:Create("Frame", {
        Parent = i.Main,
        Position = UDim2.new(0, 10, 0, 42),
        Size = UDim2.new(1, -20, 1, -52),
        BorderSizePixel = 0,
        BackgroundColor3 = Nova.Theme.Border,
    })

    i.Content = Nova:Create("Frame", {
        Parent = i.ContentOut,
        Position = UDim2.new(0, 2, 0, 2),
        Size = UDim2.new(1, -4, 1, -4),
        BorderSizePixel = 0,
        BackgroundColor3 = Nova.Theme.Background,
    })

    local contentStroke = Nova:Create("UIStroke", {
        ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
        Color = Nova.Theme.Outline,
    })

    -- Page tab helper
    function w:AddPage(name)
        local btn = Instance.new("TextButton")
        btn.AutoButtonColor = false
        btn.Text = ""
        btn.Size = UDim2.new(1, 0, 1, 0)
        btn.BorderSizePixel = 0
        btn.BackgroundColor3 = Nova.Theme.Outline

        local inner = Instance.new("Frame")
        inner.Parent = btn
        inner.Position = UDim2.new(0, 1, 0, 1)
        inner.Size = UDim2.new(1, -2, 1, -2)
        inner.BorderSizePixel = 0
        inner.BackgroundColor3 = Nova.Theme.Section

        local text = Instance.new("TextLabel")
        text.Parent = btn
        text.Text = name
        text.TextColor3 = Nova.Theme.Text
        text.BackgroundTransparency = 1
        text.AutomaticSize = Enum.AutomaticSize.XY
        text.AnchorPoint = Vector2.new(0.5, 0.5)
        text.Position = UDim2.new(0.5, 0, 0.5, 0)
        text.ZIndex = 2

        local pageData = { Button = btn, Text = text, Name = name, Active = false }
        w.Pages = w.Pages or {}
        table.insert(w.Pages, pageData)
        return pageData
    end

    function w:Set(bool)
        w.IsOpen = bool
    end

    w.Items = i
    return setmetatable(w, { __index = Nova })
end

--====================================================================--
--  Page
--====================================================================--
function Nova:Page(params)
    params = params or {}
    local p = {
        Name = params.Name or "Page",
        Pages = {},
        Columns = {},
    }

    -- Create two column holders
    local col1 = Instance.new("Frame")
    col1.Size = UDim2.new(0.5, -6, 1, 0)
    col1.BorderSizePixel = 0
    col1.BackgroundTransparency = 1

    local col2 = Instance.new("Frame")
    col2.Size = UDim2.new(0.5, -6, 1, 0)
    col2.BorderSizePixel = 0
    col2.BackgroundTransparency = 1
    col2.Position = UDim2.new(0.5, 6, 0, 0)

    local colLayout1 = Instance.new("UIListLayout")
    colLayout1.Padding = UDim.new(0, 6)
    colLayout1.SortOrder = Enum.SortOrder.LayoutOrder

    local colLayout2 = Instance.new("UIListLayout")
    colLayout2.Padding = UDim.new(0, 6)
    colLayout2.SortOrder = Enum.SortOrder.LayoutOrder

    p.Columns = { col1, col2 }

    return setmetatable(p, { __index = Nova })
end

--====================================================================--
--  Section
--====================================================================--
function Nova:Section(params)
    params = params or {}
    local s = {
        Name = params.Name or "Section",
        Side = params.Side or 1,
        Items = {},
    }

    local i = {}
    -- Outline
    i.Out = Nova:Create("Frame", {
        Size = UDim2.new(1, 0, 0, 20),
        AutomaticSize = Enum.AutomaticSize.Y,
        BorderSizePixel = 0,
        BackgroundColor3 = Nova.Theme.Outline,
    })
    Nova:AddTheme(i.Out, { BackgroundColor3 = "Outline" })

    -- Section
    i.Sec = Nova:Create("Frame", {
        Parent = i.Out,
        Position = UDim2.new(0, 1, 0, 1),
        Size = UDim2.new(1, -2, 1, -2),
        BorderSizePixel = 0,
        BackgroundColor3 = Nova.Theme.Section,
    })

    -- Content area
    i.Content = Nova:Create("Frame", {
        Parent = i.Sec,
        BackgroundTransparency = 1,
        Position = UDim2.new(0, Nova.SectionPadL, 0, Nova.SectionPadT),
        Size = UDim2.new(1, -Nova.SectionPadL * 2, 0, 0),
        AutomaticSize = Enum.AutomaticSize.Y,
        BorderSizePixel = 0,
    })

    -- Layout
    local layout = Instance.new("UIListLayout")
    layout.Padding = UDim.new(0, Nova.PaddingElem)
    layout.SortOrder = Enum.SortOrder.LayoutOrder

    local pad = Instance.new("UIPadding")
    pad.PaddingBottom = UDim.new(0, Nova.SectionPadB)

    -- Title
    i.Title = Nova:Create("TextLabel", {
        Parent = i.Out,
        Text = s.Name,
        TextColor3 = Nova.Theme.Text,
        FontFace = Nova.Font,
        TextSize = Nova.FontSize,
        Size = UDim2.new(0, 0, 0, 4),
        Position = UDim2.new(0, 6, 0, 0),
        BorderSizePixel = 0,
        AutomaticSize = Enum.AutomaticSize.X,
        BackgroundColor3 = Nova.Theme.Section,
    })
    Nova:AddTheme(i.Title, { BackgroundColor3 = "Section" })

    local titlePad = Instance.new("UIPadding")
    titlePad.PaddingRight = UDim.new(0, 4)
    titlePad.PaddingLeft = UDim.new(0, 4)

    -- Stroke
    local secStroke = Nova:Create("UIStroke", {
        ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
        Color = Nova.Theme.Outline,
    })

    s.Items = i
    return setmetatable(s, { __index = Nova })
end

--====================================================================--
--  Toggle
--====================================================================--
function Nova:Toggle(params)
    params = params or {}
    local t = {
        Name     = params.Name or "Toggle",
        Flag     = params.Flag or "",
        Default  = params.Default or false,
        Value    = false,
        Callback = params.Callback or function() end,
        Items    = {},
    }

    local parent = params.Parent or t.Section.Items.Content

    local i = {}
    i.Toggle = Nova:Create("TextButton", {
        Parent = parent,
        BackgroundTransparency = 1,
        Text = "",
        AutoButtonColor = false,
        Size = UDim2.new(1, 0, 0, 18),
        BorderSizePixel = 0,
    })

    -- indicator
    i.Ind = Nova:Create("Frame", {
        Parent = i.Toggle,
        AnchorPoint = Vector2.new(0, 0.5),
        Position = UDim2.new(0, 0, 0.5, 0),
        Size = UDim2.new(0, 8, 0, 8),
        BorderSizePixel = 0,
        BackgroundColor3 = Nova.Theme.Element,
    })
    Nova:AddTheme(i.Ind, { BackgroundColor3 = "Element" })

    local indStroke = Nova:Create("UIStroke", {
        ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
        Color = Nova.Theme.Border,
    })

    -- inner fill
    i.Inner = Nova:Create("Frame", {
        Parent = i.Ind,
        Size = UDim2.new(1, 0, 1, 0),
        BorderSizePixel = 0,
        BackgroundColor3 = Nova.Theme.Accent,
        BackgroundTransparency = 1,
    })
    Nova:AddTheme(i.Inner, { BackgroundColor3 = "Accent" })

    -- text
    i.Text = Nova:Create("TextLabel", {
        Parent = i.Toggle,
        FontFace = Nova.Font,
        Text = t.Name,
        TextColor3 = Nova.Theme.DimText,
        AnchorPoint = Vector2.new(0, 0.5),
        Position = UDim2.new(0, Nova.ToggleTextOff, 0.5, 0),
        Size = UDim2.new(0, 0, 0, 12),
        BackgroundTransparency = 1,
        AutomaticSize = Enum.AutomaticSize.X,
        BorderSizePixel = 0,
    })

    t.Items = i

    function t:Set(val)
        t.Value = val
        if val then
            Nova:Tween(i.Inner, { BackgroundTransparency = 0 })
            Nova:Tween(i.Text, { TextColor3 = Nova.Theme.Text })
        else
            Nova:Tween(i.Inner, { BackgroundTransparency = 1 })
            Nova:Tween(i.Text, { TextColor3 = Nova.Theme.DimText })
        end
        Nova.Flags[t.Flag] = val
        Nova:SafeCall(t.Callback, val)
    end

    i.Toggle:Connect("MouseButton1Down", function() t:Set(not t.Value) end)
    t:Set(t.Default)

    Nova.SetFlags[t.Flag] = function(v) t:Set(v) end
    return t
end

--====================================================================--
--  Slider
--====================================================================--
function Nova:Slider(params)
    params = params or {}
    local s = {
        Name     = params.Name or "Slider",
        Flag     = params.Flag or "",
        Default  = params.Default or 0,
        Min      = params.Min or 0,
        Max      = params.Max or 100,
        Callback = params.Callback or function() end,
        Decimals = params.Decimals or 0,
        Suffix   = params.Suffix or "",
        Value    = 0,
        Sliding  = false,
        Items    = {},
    }

    local parent = s.Section.Items.Content
    local i = {}

    i.Slider = Nova:Create("Frame", {
        Parent = parent,
        BackgroundTransparency = 1,
        Size = UDim2.new(1, 0, 0, Nova.SliderH),
        BorderSizePixel = 0,
    })

    -- name
    i.Name = Nova:Create("TextLabel", {
        Parent = i.Slider,
        FontFace = Nova.Font,
        Text = s.Name,
        TextColor3 = Nova.Theme.Text,
        BackgroundTransparency = 1,
        Size = UDim2.new(0, 0, 0, 12),
        AutomaticSize = Enum.AutomaticSize.X,
        BorderSizePixel = 0,
    })
    Nova:AddTheme(i.Name, { TextColor3 = "Text" })

    -- track
    i.Track = Nova:Create("TextButton", {
        Parent = i.Slider,
        Text = "",
        AutoButtonColor = false,
        AnchorPoint = Vector2.new(0, 1),
        Position = UDim2.new(0, 0, 1, 0),
        Size = UDim2.new(1, 0, 0, 6),
        BorderSizePixel = 0,
        BackgroundColor3 = Nova.Theme.Element,
    })
    Nova:AddTheme(i.Track, { BackgroundColor3 = "Element" })

    local trackStroke = Nova:Create("UIStroke", {
        ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
        Color = Nova.Theme.Border,
    })

    -- fill
    i.Fill = Nova:Create("Frame", {
        Parent = i.Track,
        Size = UDim2.new(1, 0, 1, 0),
        BorderSizePixel = 0,
        BackgroundColor3 = Nova.Theme.Accent,
    })
    Nova:AddTheme(i.Fill, { BackgroundColor3 = "Accent" })

    -- value label
    i.Value = Nova:Create("TextLabel", {
        Parent = i.Fill,
        FontFace = Nova.Font,
        Text = tostring(s.Default) .. s.Suffix,
        TextColor3 = Nova.Theme.Text,
        AnchorPoint = Vector2.new(1, 0),
        Size = UDim2.new(0, 0, 0, 12),
        BackgroundTransparency = 1,
        Position = UDim2.new(1, 0, 0, 0),
        AutomaticSize = Enum.AutomaticSize.X,
        BorderSizePixel = 0,
    })
    Nova:AddTheme(i.Value, { TextColor3 = "Text" })

    s.Items = i

    function s:Set(val)
        s.Value = math.clamp(val, s.Min, s.Max)
        local pix = (s.Value - s.Min) / (s.Max - s.Min)
        Nova:Tween(i.Fill, { Size = UDim2.new(pix, 0, 1, 0) })
        i.Value.Text = string.format("%.0f%s", s.Value, s.Suffix)
        Nova.Flags[s.Flag] = s.Value
        Nova:SafeCall(s.Callback, s.Value)
    end

    function s:GetSize(input)
        local x = (input.Position.X - i.Track.AbsolutePosition.X) / i.Track.AbsoluteSize.X
        return ((s.Max - s.Min) * x) + s.Min
    end

    local inputChanged
    i.Track:Connect("InputBegan", function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 then
            s.Sliding = true
            s:Set(s:GetSize(input))
            if not inputChanged then
                inputChanged = input.Changed:Connect(function()
                    if input.UserInputState == Enum.UserInputState.End then
                        s.Sliding = false
                        if inputChanged then
                            inputChanged:Disconnect()
                            inputChanged = nil
                        end
                    end
                end)
            end
        end
    end)

    Nova:Connect(UserInputService.InputChanged, function(input)
        if s.Sliding then
            s:Set(s:GetSize(input))
        end
    end)

    s:Set(s.Default)
    Nova.SetFlags[s.Flag] = function(v) s:Set(v) end
    return s
end

--====================================================================--
--  Button
--====================================================================--
function Nova:Button(params)
    params = params or {}
    local b = {
        Name     = params.Name or "Button",
        Callback = params.Callback or function() end,
        Items    = {},
    }

    local parent = params.Parent or b.Section.Items.Content
    local i = {}

    i.Button = Nova:Create("TextButton", {
        Parent = parent,
        Text = "",
        AutoButtonColor = false,
        Size = UDim2.new(1, 0, 0, Nova.ButtonH),
        BorderSizePixel = 0,
        BackgroundColor3 = Nova.Theme.Element,
    })
    Nova:AddTheme(i.Button, { BackgroundColor3 = "Element" })

    -- strokes
    local s1 = Nova:Create("UIStroke", {
        ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
        Color = Nova.Theme.Border,
        BorderOffset = UDim.new(0, 1),
    })

    local s2 = Nova:Create("UIStroke", {
        ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
        Color = Nova.Theme.Outline,
    })

    -- overlay arrow
    local overlay = Instance.new("UIGradient")
    overlay.Rotation = -90
    overlay.Color = ColorSequence.new({
        ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 255, 255)),
        ColorSequenceKeypoint.new(1, Color3.fromRGB(172, 172, 172))
    })

    i.Text = Instance.new("TextLabel")
    i.Text.Parent = i.Button
    i.Text.FontFace = Nova.Font
    i.Text.Text = b.Name
    i.Text.TextColor3 = Nova.Theme.Text
    i.Text.AnchorPoint = Vector2.new(0.5, 0.5)
    i.Text.Size = UDim2.new(0, 0, 0, 15)
    i.Text.BackgroundTransparency = 1
    i.Text.Position = UDim2.new(0.5, 0, 0.5, -1)
    i.Text.AutomaticSize = Enum.AutomaticSize.X
    i.Text.BorderSizePixel = 0

    Nova:AddTheme(i.Text, { TextColor3 = "Text" })

    b.Items = i

    function b:Press()
        Nova:Tween(i.Button, { BackgroundColor3 = Nova.Theme.Accent })
        task.wait(0.1)
        Nova:Tween(i.Button, { BackgroundColor3 = Nova.Theme.Element })
        Nova:SafeCall(b.Callback)
    end

    i.Button:Connect("MouseButton1Down", function() b:Press() end)
    return b
end

--====================================================================--
--  Dropdown
--====================================================================--
function Nova:Dropdown(params)
    params = params or {}
    local d = {
        Name     = params.Name or "Dropdown",
        Items    = params.Items or {},
        Flag     = params.Flag or "",
        Default  = params.Default or "",
        Callback = params.Callback or function() end,
        IsOpen   = false,
        Options  = {},
        Items    = {},
    }

    local parent = params.Parent or d.Section.Items.Content
    local i = {}

    i.Dropdown = Nova:Create("Frame", {
        Parent = parent,
        BackgroundTransparency = 1,
        Size = UDim2.new(1, 0, 0, 40),
        BorderSizePixel = 0,
    })

    -- main button
    i.Main = Nova:Create("TextButton", {
        Parent = i.Dropdown,
        Text = "",
        AutoButtonColor = false,
        AnchorPoint = Vector2.new(0, 1),
        Position = UDim2.new(0, 0, 1, 0),
        Size = UDim2.new(1, 0, 0, 20),
        ClipsDescendants = true,
        BorderSizePixel = 0,
        BackgroundColor3 = Nova.Theme.Element,
    })
    Nova:AddTheme(i.Main, { BackgroundColor3 = "Element" })

    -- text
    i.Text = Nova:Create("TextLabel", {
        Parent = i.Main,
        FontFace = Nova.Font,
        Text = d.Name,
        TextColor3 = Nova.Theme.Text,
        AnchorPoint = Vector2.new(0, 0.5),
        Position = UDim2.new(0, 10, 0.5, 0),
        Size = UDim2.new(0, 0, 0, 14),
        BackgroundTransparency = 1,
        AutomaticSize = Enum.AutomaticSize.X,
        BorderSizePixel = 0,
    })
    Nova:AddTheme(i.Text, { TextColor3 = "Text" })

    -- arrow
    i.Arrow = Nova:Create("ImageLabel", {
        Parent = i.Main,
        BackgroundTransparency = 1,
        Image = "rbxassetid://603109466",
        Size = UDim2.new(0, 10, 0, 6),
        AnchorPoint = Vector2.new(1, 0.5),
        Position = UDim2.new(1, -10, 0.5, 0),
        ImageColor3 = Nova.Theme.Text,
        Rotation = 0,
    })
    Nova:AddTheme(i.Arrow, { ImageColor3 = "Text" })

    -- option holder (hidden)
    local holder = Instance.new("TextButton")
    holder.Name = "\0"
    holder.AutoButtonColor = false
    holder.Text = ""
    holder.Size = UDim2.new(0, 210, 0, 50)
    holder.BorderSizePixel = 0
    holder.BackgroundColor3 = Nova.Theme.Background

    local holderStroke = Instance.new("UIStroke")
    holderStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
    holderStroke.Color = Nova.Theme.Outline

    local holderLayout = Instance.new("UIListLayout")
    holderLayout.Padding = UDim.new(0, 3)
    holderLayout.SortOrder = Enum.SortOrder.LayoutOrder

    local holderPad = Instance.new("UIPadding")
    holderPad.PaddingTop = UDim.new(0, 4)
    holderPad.PaddingLeft = UDim.new(0, 8)
    holderPad.PaddingBottom = UDim.new(0, 6)

    d.Options = {} -- populated by :Add()

    function d:Add(item)
        local opt = Instance.new("TextButton")
        opt.Parent = holder
        opt.Text = ""
        opt.AutoButtonColor = false
        opt.Size = UDim2.new(0, 0, 0, 15)
        opt.BorderSizePixel = 0
        opt.BackgroundTransparency = 1

        local optText = Instance.new("TextLabel")
        optText.Parent = opt
        optText.Text = item
        optText.TextColor3 = Nova.Theme.Text
        optText.BackgroundTransparency = 1
        optText.Size = UDim2.new(1, -16, 1, 0)
        optText.Position = UDim2.new(0, 8, 0, 0)

        local data = { Button = opt, Name = item, IsSelected = false }
        Nova:AddTheme(optText, { TextColor3 = "Text" })

        function data:Select()
            data.IsSelected = not data.IsSelected
            if d.Multi then
                -- multi-select
                local idx = table.find(d.Value, data.Name)
                if idx then
                    table.remove(d.Value, idx)
                else
                    table.insert(d.Value, data.Name)
                end
                h.Text = table.concat(d.Value, ", ")
            else
                d.Value = data.Name
                for _, v in d.Options do
                    v.IsSelected = false
                    v.Button.BackgroundTransparency = 1
                end
                data.IsSelected = true
            end
            Nova.Flags[d.Flag] = d.Value
            Nova:SafeCall(d.Callback, d.Value)
        end

        opt:Connect("MouseButton1Down", function() data:Select() end)
        d.Options[item] = data
        return data
    end

    function d:SetOpen(bool)
        d.IsOpen = bool
        if bool then
            holder.Parent = Nova.Holder.Instance
            holder.Position = UDim2.new(0, i.Main.AbsolutePosition.X, 0, i.Main.AbsolutePosition.Y + i.Main.AbsoluteSize.Y + 10)
            holder.Size = UDim2.new(0, i.Main.AbsoluteSize.X, 0, 50)
            holder.Visible = true
            Nova:FadeDescendants(holder, true)
        else
            Nova:FadeDescendants(holder, false)
            holder.Parent = Nova.UnusedHolder.Instance
        end
    end

    i.Main:Connect("MouseButton1Down", function() d:SetOpen(not d.IsOpen) end)

    for _, item in d.Items do
        d:Add(item)
    end

    d:Set(d.Default)
    Nova.SetFlags[d.Flag] = function(v) d:Set(v) end
    return d
end

--====================================================================--
--  Label
--====================================================================--
function Nova:Label(params)
    params = params or {}
    local l = {
        Name = params.Name or "Label",
        Items = {},
    }

    local parent = params.Parent or l.Section.Items.Content
    local i = {}

    i.Label = Nova:Create("Frame", {
        Parent = parent,
        BackgroundTransparency = 1,
        Size = UDim2.new(1, 0, 0, 12),
        BorderSizePixel = 0,
    })

    i.Text = Nova:Create("TextLabel", {
        Parent = i.Label,
        FontFace = Nova.Font,
        Text = l.Name,
        TextColor3 = Nova.Theme.Text,
        AnchorPoint = Vector2.new(0, 0.5),
        Size = UDim2.new(0, 0, 0, 12),
        BackgroundTransparency = 1,
        Position = UDim2.new(0, 0, 0.5, 0),
        AutomaticSize = Enum.AutomaticSize.X,
        BorderSizePixel = 0,
    })
    Nova:AddTheme(i.Text, { TextColor3 = "Text" })

    l.Items = i

    function l:SetText(t) i.Text.Text = t end
    function l:SetVisibility(v) i.Label.Visible = v end

    return setmetatable(l, { __index = Nova })
end

--====================================================================--
--  Textbox
--====================================================================--
function Nova:Textbox(params)
    params = params or {}
    local tx = {
        Name = params.Name or "Textbox",
        Flag = params.Flag or "",
        Default = params.Default or "",
        Callback = params.Callback or function() end,
        Placeholder = params.Placeholder or "...",
        Numeric = params.Numeric or false,
        Items = {},
    }

    local parent = params.Parent or tx.Section.Items.Content
    local i = {}

    i.Box = Nova:Create("Frame", {
        Parent = parent,
        BackgroundTransparency = 1,
        Size = UDim2.new(1, 0, 0, 20),
        BorderSizePixel = 0,
    })

    -- background
    i.Bg = Nova:Create("Frame", {
        Parent = i.Box,
        ClipsDescendants = true,
        Size = UDim2.new(1, 0, 1, 0),
        BorderSizePixel = 0,
        BackgroundColor3 = Nova.Theme.Element,
    })
    Nova:AddTheme(i.Bg, { BackgroundColor3 = "Element" })

    local bgStroke = Nova:Create("UIStroke", {
        ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
        Color = Nova.Theme.Outline,
    })

    -- input
    i.Input = Instance.new("TextBox")
    i.Input.Parent = i.Bg
    i.Input.PlaceholderColor3 = Nova.Theme.DimText
    i.Input.PlaceholderText = tx.Placeholder
    i.Input.Size = UDim2.new(1, -16, 0, 15)
    i.Input.TextColor3 = Nova.Theme.Text
    i.Input.BackgroundTransparency = 1
    i.Input.TextXAlignment = Enum.TextXAlignment.Left
    i.Input.Position = UDim2.new(0, 8, 0.5, -1)
    i.Input.ClearTextOnFocus = false
    i.Input.BorderSizePixel = 0

    tx.Items = i

    function tx:Set(val)
        i.Input.Text = val
        Nova.Flags[tx.Flag] = val
        Nova:SafeCall(tx.Callback, val)
    end

    if params.Finished then
        i.Input:Connect("FocusLost", function(enter)
            if enter then tx:Set(i.Input.Text) end
        end)
    else
        Nova:Connect(i.Input:GetPropertyChangedSignal("Text"), function()
            tx:Set(i.Input.Text)
        end)
    end

    tx:Set(tx.Default)
    Nova.SetFlags[tx.Flag] = function(v) tx:Set(v) end
    return tx
end

--====================================================================--
--  Colorpicker
--====================================================================--
function Nova:Colorpicker(params)
    params = params or {}

    -- Store on Nova for reuse
    local cp = {
        Hue = 0, Saturation = 0, Value = 0,
        Alpha = 0,
        Color = Color3.fromRGB(255, 255, 255),
        HexValue = "#FFFFFF",
        Flag = params.Flag or "",
        IsOpen = false,
        Callback = params.Callback or function() end,
        Items = {},
    }

    local i = {}
    -- Button
    i.Btn = Nova:Create("TextButton", {
        FontFace = Nova.Font, TextSize = Nova.FontSize,
        Text = "", AutoButtonColor = false,
        Size = UDim2.new(0, 22, 0, 12),
        BorderSizePixel = 0,
        BackgroundColor3 = Color3.fromRGB(158, 255, 252),
    })
    Nova:AddTheme(i.Btn, { BackgroundColor3 = "Element" })

    local btnStroke = Nova:Create("UIStroke", {
        ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
        Color = Nova.Theme.Border,
    })

    -- Window
    i.Window = Nova:Create("TextButton", {
        Text = "", AutoButtonColor = false,
        Size = UDim2.new(0, 230, 0, 205),
        Position = UDim2.new(0, 1056, 0, 203),
        BorderSizePixel = 0,
        BackgroundColor3 = Nova.Theme.Background,
    })
    Nova:AddTheme(i.Window, { BackgroundColor3 = "Background" })

    local winStroke = Nova:Create("UIStroke", {
        ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
        Color = Nova.Theme.Outline,
    })

    -- Accent line
    local accent = Nova:Create("Frame", {
        Parent = i.Window,
        Size = UDim2.new(1, 0, 0, 1),
        BorderSizePixel = 0,
        BackgroundColor3 = Nova.Theme.Accent,
    })

    -- Palette
    i.Palette = Nova:Create("TextButton", {
        Parent = i.Window,
        Text = "", AutoButtonColor = false,
        Position = UDim2.new(0, 10, 0, 12),
        Size = UDim2.new(1, -46, 1, -48),
        BorderSizePixel = 0,
        BackgroundColor3 = Color3.fromRGB(255, 255, 255),
    })

    -- Saturation gradient
    local sat = Instance.new("UIGradient")
    sat.Transparency = NumberSequence.new({
        NumberSequenceKeypoint.new(0, 1),
        NumberSequenceKeypoint.new(1, 0)
    })

    -- Value overlay
    local valOv = Instance.new("Frame")
    valOv.Size = UDim2.new(1, 0, 1, 0)
    valOv.BorderSizePixel = 0
    valOv.BackgroundColor3 = Color3.fromRGB(0, 0, 0)

    local valGrad = Instance.new("UIGradient")
    valGrad.Rotation = 90
    valGrad.Transparency = NumberSequence.new({
        NumberSequenceKeypoint.new(0, 1),
        NumberSequenceKeypoint.new(1, 0)
    })

    -- Hue bar
    i.Hue = Nova:Create("TextButton", {
        Parent = i.Window,
        Text = "", AutoButtonColor = false,
        AnchorPoint = Vector2.new(1, 0),
        BackgroundColor3 = Color3.fromRGB(255, 255, 255),
        Position = UDim2.new(1, -10, 0, 12),
        Size = UDim2.new(0, 15, 1, -20),
        BorderSizePixel = 0,
    })

    local hueGrad = Instance.new("UIGradient")
    hueGrad.Rotation = 90
    hueGrad.Color = ColorSequence.new({
        ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 0, 0)),
        ColorSequenceKeypoint.new(0.17, Color3.fromRGB(255, 255, 0)),
        ColorSequenceKeypoint.new(0.33, Color3.fromRGB(0, 255, 0)),
        ColorSequenceKeypoint.new(0.5, Color3.fromRGB(0, 255, 255)),
        ColorSequenceKeypoint.new(0.67, Color3.fromRGB(0, 0, 255)),
        ColorSequenceKeypoint.new(0.83, Color3.fromRGB(255, 0, 255)),
        ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 0, 0))
    })

    -- Alpha bar
    i.Alpha = Nova:Create("TextButton", {
        Parent = i.Window,
        Text = "", AutoButtonColor = false,
        AnchorPoint = Vector2.new(0, 1),
        Position = UDim2.new(0, 10, 1, -10),
        Size = UDim2.new(1, -46, 0, 15),
        BorderSizePixel = 0,
    })

    local alphaColor = Instance.new("Frame")
    alphaColor.Size = UDim2.new(1, 0, 1, 0)
    alphaColor.BorderSizePixel = 0
    alphaColor.BackgroundColor3 = Color3.fromRGB(158, 255, 252)

    -- Draggers
    i.PaletteDrag = Nova:Create("Frame", { Size = UDim2.new(0, 1, 0, 1), BackgroundColor3 = Color3.fromRGB(255, 255, 255), BorderSizePixel = 0 })
    i.HueDrag = Nova:Create("Frame", { Size = UDim2.new(1, 0, 0, 1), BackgroundColor3 = Color3.fromRGB(255, 255, 255), BorderSizePixel = 0 })
    i.AlphaDrag = Nova:Create("Frame", { Size = UDim2.new(0, 1, 1, 0), BackgroundColor3 = Color3.fromRGB(255, 255, 255), BorderSizePixel = 0 })

    -- Copy/paste
    local copyWin = Instance.new("TextButton")
    copyWin.Text = ""
    copyWin.AutoButtonColor = false
    copyWin.Size = UDim2.new(0, 96, 0, 44)
    copyWin.BorderSizePixel = 0
    copyWin.BackgroundColor3 = Nova.Theme.Background
    copyWin.Visible = false

    function cp:Update()
        local h, s, v = cp.Hue, cp.Saturation, cp.Value
        cp.Color = Color3.fromHSV(h, s, v)
        cp.HexValue = cp.Color:ToHex()
        Nova:Tween(i.Palette, { BackgroundColor3 = Color3.fromHSV(h, 1, 1) })
        Nova.Flags[cp.Flag] = { Color = cp.Color, Hex = cp.HexValue, Alpha = cp.Alpha }
    end

    return setmetatable(cp, { __index = Nova })
end

--====================================================================--
--  Keybind
--====================================================================--
function Nova:Keybind(params)
    params = params or {}
    local k = {
        Name = params.Name or "Keybind",
        Flag = params.Flag or "",
        Default = params.Default,
        Mode = params.Mode or "Toggle",
        Callback = params.Callback or function() end,
        Key = "",
        Value = "",
        Toggled = false,
        Picking = false,
        IsOpen = false,
        Items = {},
    }

    local parent = params.Parent or k.Section.Items.Content
    local i = {}

    i.Key = Nova:Create("TextButton", {
        Parent = parent,
        Text = "",
        AutoButtonColor = false,
        FontFace = Nova.Font,
        TextSize = Nova.FontSize,
        Size = UDim2.new(0, 0, 1, 0),
        AutomaticSize = Enum.AutomaticSize.X,
        BorderSizePixel = 0,
        BackgroundTransparency = 1,
    })
    Nova:AddTheme(i.Key, { TextColor3 = "Text" })

    local text = Instance.new("TextLabel")
    text.FontFace = Nova.Font
    text.TextSize = Nova.FontSize
    text.Text = "[...]"
    text.TextColor3 = Nova.Theme.Text
    text.BackgroundTransparency = 1
    text.AutomaticSize = Enum.AutomaticSize.XY
    text.Position = UDim2.new(0, 8, 0.5, 0)
    text.AnchorPoint = Vector2.new(0, 0.5)

    -- window (hidden, for mode selection)
    local win = Nova:Create("TextButton", {
        Text = "",
        AutoButtonColor = false,
        Size = UDim2.new(0, 200, 0, 82),
        Position = UDim2.new(0, 1056, 0, 521),
        BorderSizePixel = 0,
        BackgroundColor3 = Nova.Theme.Background,
    })
    Nova:AddTheme(win, { BackgroundColor3 = "Background" })

    local winStroke = Nova:Create("UIStroke", {
        ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
        Color = Nova.Theme.Border,
        BorderOffset = UDim.new(0, 1),
    })

    local winStroke2 = Nova:Create("UIStroke", {
        ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
        Color = Nova.Theme.Outline,
    })

    -- mode button
    local modeBtn = Nova:Create("TextButton", {
        Parent = win,
        Text = "",
        AutoButtonColor = false,
        Size = UDim2.new(1, -16, 0, 40),
        Position = UDim2.new(0, 8, 0, 8),
        BorderSizePixel = 0,
        BackgroundColor3 = Nova.Theme.Element,
    })
    Nova:AddTheme(modeBtn, { BackgroundColor3 = "Element" })

    local modeText = Instance.new("TextLabel")
    modeText.Parent = modeBtn
    modeText.FontFace = Nova.Font
    modeText.Text = "Mode: Toggle"
    modeText.TextColor3 = Nova.Theme.Text
    modeText.BackgroundTransparency = 1
    modeText.AutomaticSize = Enum.AutomaticSize.XY
    modeText.AnchorPoint = Vector2.new(0.5, 0.5)
    modeText.Position = UDim2.new(0.5, 0, 0.5, 0)
    modeText.ZIndex = 2

    k.Items = i

    function k:Set(key)
        k.Key = tostring(key)
        k.Value = tostring(key):gsub("Enum.KeyCode.", ""):gsub("Enum.UserInputType.", "")
        i.Key.Text = "[" .. k.Value .. "]"
    end

    i.Key:Connect("MouseButton1Click", function()
        k.Picking = true
        i.Key.Text = "press a key"
        local conn = UserInputService.InputBegan:Connect(function(input)
            if input.UserInputType == Enum.UserInputType.Keyboard then
                k:Set(input.KeyCode)
            end
            conn:Disconnect()
        end)
    end)

    return setmetatable(k, { __index = Nova })
end

--====================================================================--
--  Notification
--====================================================================--
function Nova:Notification(text, duration, color)
    local items = {}
    local notif = Nova:Create("Frame", {
        Parent = Nova.NotifHolder.Instance,
        Size = UDim2.new(0, 0, 0, 20),
        Position = UDim2.new(1, 0, 0, 0),
        AutomaticSize = Enum.AutomaticSize.X,
        BorderSizePixel = 0,
        BackgroundColor3 = Nova.Theme.Section,
    })
    Nova:AddTheme(notif, { BackgroundColor3 = "Section" })

    local pad = Instance.new("UIPadding")
    pad.PaddingRight = UDim.new(0, 8)
    pad.PaddingLeft = UDim.new(0, 8)

    -- accent line
    local accent = Instance.new("Frame")
    accent.Parent = notif
    accent.Position = UDim2.new(0, -8, 0, 0)
    accent.Size = UDim2.new(0, 1, 1, 0)
    accent.BorderSizePixel = 0
    accent.BackgroundColor3 = color or Nova.Theme.Accent

    -- text
    local txt = Instance.new("TextLabel")
    txt.Parent = notif
    txt.FontFace = Nova.Font
    txt.TextSize = Nova.FontSize
    txt.Text = text
    txt.TextColor3 = Nova.Theme.Text
    txt.AnchorPoint = Vector2.new(0, 0.5)
    txt.Size = UDim2.new(0, 0, 0, 15)
    txt.BackgroundTransparency = 1
    txt.Position = UDim2.new(0, 2, 0.5, -1)
    txt.BorderSizePixel = 0
    txt.AutomaticSize = Enum.AutomaticSize.X

    -- animate in
    local size = txt.AbsoluteSize
    notif.AutomaticSize = Enum.AutomaticSize.None
    task.wait()
    notif.Size = UDim2.new(0, 0, 0, size.Y)
    notif.Position = UDim2.new(1, 0, 0, 0)

    local info = TweenInfo.new(0.85, Enum.EasingStyle.Exponential, Enum.EasingDirection.Out)
    Nova:Tween(notif, { Size = UDim2.new(0, size.X, 0, size.Y) }, info)
    Nova:Tween(notif, { Position = UDim2.new(1, -size.X - 10, 0, 0) }, info)

    -- auto-dismiss
    task.delay(duration or 3, function()
        Nova:Tween(notif, { Size = UDim2.new(0, 0, 0, size.Y) }, info)
        task.wait(0.5)
        notif:Destroy()
    end)
end

-- Return all widgets
return {
    Window = Nova.Window,
    Page = Nova.Page,
    Section = Nova.Section,
    Toggle = Nova.Toggle,
    Slider = Nova.Slider,
    Button = Nova.Button,
    Dropdown = Nova.Dropdown,
    Label = Nova.Label,
    Textbox = Nova.Textbox,
    Colorpicker = Nova.Colorpicker,
    Keybind = Nova.Keybind,
    Notification = Nova.Notification,
}