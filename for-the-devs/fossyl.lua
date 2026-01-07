-- Fossyl Neovim Colorscheme
-- A warm, earthy theme with neobrutalist aesthetics

local M = {}

M.colors = {
  -- Base colors
  bg = "#3d2a0d",
  fg = "#f8e8d6",

  -- Brand colors
  tan = "#E3BC8E",
  orange = "#DA8825",
  cream = "#F8E8D6",
  brown = "#6D4204",
  dark_brown = "#3D2A0D",
  bright_orange = "#EE7508",
  red_orange = "#F5583A",
  gold = "#E8C547",
  sage_green = "#A3B18A",
  comment = "#a08060",

  -- UI colors (derived)
  selection = "#6D4204",
  cursor_line = "#4a3210",
  line_nr = "#a08060",
  visual = "#6D4204",
  search = "#E8C547",
  error = "#F5583A",
  warning = "#EE7508",
  info = "#DA8825",
  hint = "#A3B18A",
}

function M.setup()
  vim.cmd("hi clear")
  if vim.fn.exists("syntax_on") then
    vim.cmd("syntax reset")
  end

  vim.o.background = "dark"
  vim.g.colors_name = "fossyl"

  local c = M.colors
  local hi = function(group, opts)
    vim.api.nvim_set_hl(0, group, opts)
  end

  -- Editor UI
  hi("Normal", { fg = c.fg, bg = c.bg })
  hi("NormalFloat", { fg = c.fg, bg = c.dark_brown })
  hi("FloatBorder", { fg = c.brown, bg = c.dark_brown })
  hi("Cursor", { fg = c.bg, bg = c.cream })
  hi("CursorLine", { bg = c.cursor_line })
  hi("CursorColumn", { bg = c.cursor_line })
  hi("ColorColumn", { bg = c.cursor_line })
  hi("LineNr", { fg = c.line_nr })
  hi("CursorLineNr", { fg = c.gold, bold = true })
  hi("SignColumn", { fg = c.line_nr, bg = c.bg })
  hi("VertSplit", { fg = c.brown })
  hi("WinSeparator", { fg = c.brown })
  hi("StatusLine", { fg = c.cream, bg = c.brown })
  hi("StatusLineNC", { fg = c.comment, bg = c.dark_brown })
  hi("TabLine", { fg = c.comment, bg = c.dark_brown })
  hi("TabLineFill", { bg = c.dark_brown })
  hi("TabLineSel", { fg = c.cream, bg = c.brown, bold = true })
  hi("Pmenu", { fg = c.fg, bg = c.dark_brown })
  hi("PmenuSel", { fg = c.cream, bg = c.brown })
  hi("PmenuSbar", { bg = c.brown })
  hi("PmenuThumb", { bg = c.tan })
  hi("Visual", { bg = c.visual })
  hi("VisualNOS", { bg = c.visual })
  hi("Search", { fg = c.bg, bg = c.search })
  hi("IncSearch", { fg = c.bg, bg = c.bright_orange })
  hi("CurSearch", { fg = c.bg, bg = c.bright_orange })
  hi("MatchParen", { fg = c.gold, bold = true, underline = true })
  hi("Folded", { fg = c.comment, bg = c.cursor_line })
  hi("FoldColumn", { fg = c.comment, bg = c.bg })
  hi("NonText", { fg = c.brown })
  hi("SpecialKey", { fg = c.brown })
  hi("Whitespace", { fg = c.brown })
  hi("EndOfBuffer", { fg = c.brown })
  hi("Directory", { fg = c.gold })
  hi("Title", { fg = c.gold, bold = true })
  hi("ErrorMsg", { fg = c.error })
  hi("WarningMsg", { fg = c.warning })
  hi("ModeMsg", { fg = c.tan })
  hi("MoreMsg", { fg = c.sage_green })
  hi("Question", { fg = c.sage_green })
  hi("WildMenu", { fg = c.bg, bg = c.gold })
  hi("Conceal", { fg = c.comment })
  hi("SpellBad", { sp = c.error, undercurl = true })
  hi("SpellCap", { sp = c.warning, undercurl = true })
  hi("SpellLocal", { sp = c.info, undercurl = true })
  hi("SpellRare", { sp = c.hint, undercurl = true })

  -- Syntax highlighting (matching your docs theme)
  hi("Comment", { fg = c.comment, italic = true })
  hi("Constant", { fg = c.bright_orange })
  hi("String", { fg = c.sage_green })
  hi("Character", { fg = c.sage_green })
  hi("Number", { fg = c.bright_orange })
  hi("Boolean", { fg = c.sage_green })
  hi("Float", { fg = c.bright_orange })
  hi("Identifier", { fg = c.tan })
  hi("Function", { fg = c.bright_orange })
  hi("Statement", { fg = c.red_orange })
  hi("Conditional", { fg = c.red_orange })
  hi("Repeat", { fg = c.red_orange })
  hi("Label", { fg = c.red_orange })
  hi("Operator", { fg = c.cream })
  hi("Keyword", { fg = c.red_orange })
  hi("Exception", { fg = c.red_orange })
  hi("PreProc", { fg = c.red_orange })
  hi("Include", { fg = c.red_orange })
  hi("Define", { fg = c.red_orange })
  hi("Macro", { fg = c.red_orange })
  hi("PreCondit", { fg = c.red_orange })
  hi("Type", { fg = c.orange })
  hi("StorageClass", { fg = c.red_orange })
  hi("Structure", { fg = c.orange })
  hi("Typedef", { fg = c.orange })
  hi("Special", { fg = c.gold })
  hi("SpecialChar", { fg = c.gold })
  hi("Tag", { fg = c.gold })
  hi("Delimiter", { fg = c.cream })
  hi("SpecialComment", { fg = c.comment, italic = true })
  hi("Debug", { fg = c.warning })
  hi("Underlined", { fg = c.tan, underline = true })
  hi("Ignore", { fg = c.comment })
  hi("Error", { fg = c.error })
  hi("Todo", { fg = c.bg, bg = c.gold, bold = true })

  -- Treesitter
  hi("@comment", { link = "Comment" })
  hi("@keyword", { fg = c.red_orange })
  hi("@keyword.function", { fg = c.red_orange })
  hi("@keyword.return", { fg = c.red_orange })
  hi("@keyword.operator", { fg = c.red_orange })
  hi("@string", { fg = c.sage_green })
  hi("@string.escape", { fg = c.gold })
  hi("@function", { fg = c.bright_orange })
  hi("@function.call", { fg = c.bright_orange })
  hi("@function.builtin", { fg = c.bright_orange })
  hi("@method", { fg = c.bright_orange })
  hi("@method.call", { fg = c.bright_orange })
  hi("@variable", { fg = c.tan })
  hi("@variable.builtin", { fg = c.tan, italic = true })
  hi("@variable.parameter", { fg = c.tan })
  hi("@property", { fg = c.gold })
  hi("@field", { fg = c.gold })
  hi("@parameter", { fg = c.tan })
  hi("@constant", { fg = c.bright_orange })
  hi("@constant.builtin", { fg = c.bright_orange })
  hi("@number", { fg = c.bright_orange })
  hi("@boolean", { fg = c.sage_green })
  hi("@type", { fg = c.orange })
  hi("@type.builtin", { fg = c.orange })
  hi("@type.definition", { fg = c.orange })
  hi("@constructor", { fg = c.orange })
  hi("@tag", { fg = c.gold })
  hi("@tag.attribute", { fg = c.tan })
  hi("@tag.delimiter", { fg = c.cream })
  hi("@punctuation", { fg = c.cream })
  hi("@punctuation.bracket", { fg = c.cream })
  hi("@punctuation.delimiter", { fg = c.cream })
  hi("@punctuation.special", { fg = c.gold })
  hi("@operator", { fg = c.cream })
  hi("@namespace", { fg = c.orange })

  -- LSP
  hi("DiagnosticError", { fg = c.error })
  hi("DiagnosticWarn", { fg = c.warning })
  hi("DiagnosticInfo", { fg = c.info })
  hi("DiagnosticHint", { fg = c.hint })
  hi("DiagnosticUnderlineError", { sp = c.error, undercurl = true })
  hi("DiagnosticUnderlineWarn", { sp = c.warning, undercurl = true })
  hi("DiagnosticUnderlineInfo", { sp = c.info, undercurl = true })
  hi("DiagnosticUnderlineHint", { sp = c.hint, undercurl = true })
  hi("LspReferenceText", { bg = c.cursor_line })
  hi("LspReferenceRead", { bg = c.cursor_line })
  hi("LspReferenceWrite", { bg = c.cursor_line })

  -- Git signs
  hi("GitSignsAdd", { fg = c.sage_green })
  hi("GitSignsChange", { fg = c.gold })
  hi("GitSignsDelete", { fg = c.red_orange })

  -- Diff
  hi("DiffAdd", { fg = c.sage_green, bg = "#2a3a20" })
  hi("DiffChange", { fg = c.gold, bg = "#3a3a10" })
  hi("DiffDelete", { fg = c.red_orange, bg = "#3a2020" })
  hi("DiffText", { fg = c.cream, bg = c.brown })

  -- Telescope
  hi("TelescopeNormal", { fg = c.fg, bg = c.dark_brown })
  hi("TelescopeBorder", { fg = c.brown, bg = c.dark_brown })
  hi("TelescopePromptNormal", { fg = c.fg, bg = c.cursor_line })
  hi("TelescopePromptBorder", { fg = c.brown, bg = c.cursor_line })
  hi("TelescopePromptTitle", { fg = c.bg, bg = c.gold, bold = true })
  hi("TelescopePreviewTitle", { fg = c.bg, bg = c.sage_green, bold = true })
  hi("TelescopeResultsTitle", { fg = c.bg, bg = c.orange, bold = true })
  hi("TelescopeSelection", { bg = c.selection })
  hi("TelescopeMatching", { fg = c.gold, bold = true })

  -- nvim-cmp
  hi("CmpItemAbbr", { fg = c.fg })
  hi("CmpItemAbbrMatch", { fg = c.gold, bold = true })
  hi("CmpItemAbbrMatchFuzzy", { fg = c.gold })
  hi("CmpItemKind", { fg = c.orange })
  hi("CmpItemMenu", { fg = c.comment })

  -- Indent blankline
  hi("IndentBlanklineChar", { fg = c.brown })
  hi("IndentBlanklineContextChar", { fg = c.tan })

  -- Neotree / NvimTree
  hi("NeoTreeNormal", { fg = c.fg, bg = c.dark_brown })
  hi("NeoTreeNormalNC", { fg = c.fg, bg = c.dark_brown })
  hi("NvimTreeNormal", { fg = c.fg, bg = c.dark_brown })
  hi("NvimTreeNormalNC", { fg = c.fg, bg = c.dark_brown })
end

return M
