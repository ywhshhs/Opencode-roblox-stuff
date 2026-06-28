local Library = loadstring(game:HttpGet("https://raw.githubusercontent.com/sametexe001/sametlibs/refs/heads/main/nexonix/Library.lua"))()

local KeybindList = Library:KeybindList({Name = "Keybind List"})

local Window = Library:Window({Logo = "rbxassetid://77749228793011"}) do 
    local TabOne = Window:Page({Icon = "rbxassetid://129245697782918"})
    local TabTwo = Window:Page({Icon = "rbxassetid://129245697782918"})
    local TabThree = Window:Page({Icon = "rbxassetid://129245697782918"})
    local TabFour = Window:Page({Icon = "rbxassetid://129245697782918"})

    do
        local AimbotSection = TabOne:Section({Name = "aimbot", Side = 1})
        local WeaponSection = TabOne:Section({Name = "weapon", Side = 2})
        TabOne:Section({Name = "weapon", Side = 2})
        TabOne:Section({Name = "weapon", Side = 2})
        TabOne:Section({Name = "weapon", Side = 2})
        TabOne:Section({Name = "weapon", Side = 2})

        for Index = 1, 2 do 
            do
                AimbotSection:Toggle({
                    Name = "aimbot",
                    Flag = "aimbot",
                    Default = false,
                    Tooltip = "this a toggle lmfaıo",
                    Callback = function(Value)
                        print(Value)
                    end
                })

                AimbotSection:Button({
                    Name = "Button",
                    Tooltip = "this a toggle lmfaıo",
                    Callback = function()
                        print("Button")
                    end
                })

                AimbotSection:Slider({
                    Name = "Slider",
                    Tooltip = "this a toggle lmfaıo",
                    Flag = "Slider",
                    Min = 1,
                    Max = 100,
                    Default = 50,
                    Suffix = "%",
                    Decimals = 1,
                    Callback = function(Value)
                        print(Value)
                    end
                })

                AimbotSection:Dropdown({
                    Name = "Dropdown",
                    Flag = "Dropdown",
                    Default = "First",
                    Items = {"First", "Second", "Third", "Fourth", "Fifth", "Sixth"},
                    Callback = function(Value)
                        print(Value)
                    end
                })

                AimbotSection:Label({Name = "picker"}):Colorpicker({
                    Flag = "Colorpicker",
                    Default = Color3.fromRGB(255, 255, 255),
                    Callback = function(Value)
                        print(Value)
                    end
                })

                AimbotSection:Label({Name = "picker 2"}):Keybind({
                    Name = "Keybind",
                    Flag = "Keybind",
                    Default = Enum.KeyCode.E,
                    Mode = "Toggle",
                    Callback = function(Value)
                        print(Value)
                    end
                })

                AimbotSection:Textbox({
                    Name = "Textbox",
                    Placeholder = "...",
                    Flag = "Textbox",
                    Numeric = false,
                    Finished = false,
                    Callback = function(Value)
                        print(Value)
                    end
                })
            end

            do
                local Toggle = WeaponSection:Toggle({
                    Name = "Toggle",
                    Flag = "Toggle",
                    Default = false,
                    Tooltip = "this a toggle lmfaıo",
                    Callback = function(Value)
                        print(Value)
                    end
                })

                local ToggleSettings = Toggle:Settings(200)

                ToggleSettings:Toggle({
                    Name = "aimbot",
                    Flag = "aimbot2",
                    Default = false,
                    Callback = function(Value)
                        print(Value)
                    end
                })

                ToggleSettings:Button({
                    Name = "Button",
                    Callback = function()
                        print("Button")
                    end
                })

                ToggleSettings:Slider({
                    Name = "Slider",
                    Flag = "Slider2",
                    Min = 1,
                    Max = 100,
                    Default = 50,
                    Suffix = "%",
                    Decimals = 1,
                    Callback = function(Value)
                        print(Value)
                    end
                })

                ToggleSettings:Dropdown({
                    Name = "Dropdown",
                    Flag = "Dropdown2",
                    Default = "First",
                    Items = {"First", "Second", "Third", "Fourth", "Fifth", "Sixth"},
                    Callback = function(Value)
                        print(Value)
                    end
                })

                ToggleSettings:Label({Name = "picker"}):Colorpicker({
                    Flag = "Colorpicker2",
                    Default = Color3.fromRGB(255, 255, 255),
                    Callback = function(Value)
                        print(Value)
                    end
                })

                Toggle:Keybind({
                    Name = "Keybind",
                    Flag = "Keybind2",
                    Default = Enum.KeyCode.E,
                    Mode = "Toggle",
                    Callback = function(Value)
                        print(Value)
                    end
                })

                WeaponSection:RangeSlider({
                    Name = "range",
                    Flag = "range",
                    Default = {3,5},
                    Gap = 16,
                    Min = 0.1,
                    Max = 10,
                    Decimals = 0.1,
                    Callback = function(value)
                        local min = value[1]
                        local max = value[2]
                        warn(min, max)
                    end
                })
            end
        end
    end
end

local Watermark = Window:Watermark({Name = "Watermarkrrrr", Logo = "rbxassetid://77749228793011"}) do
    Watermark:AddItem("rbxassetid://79077177539456", LocalPlayer.Name)
    
    local FrameTimer = tick()
    local FPS = 60
    local FrameCount = 0

    local FPSText, FPSTextHolder = Watermark:AddItem("rbxassetid://81108100527616", "FPS: " .. FPS)

    Library:Connect(RunService.RenderStepped, function()
        FrameCount += 1
        if tick() - FrameTimer >= 1 then
            FPS = FrameCount
            FrameCount = 0
            FrameTimer = tick()
        end

        FPSText.Instance.Text = "FPS: " .. FPS
    end)
end

Library:Notification("test notificationnn", 5, Color3.fromRGB(255, 0, 0))
