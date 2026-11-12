/**
 * C# (.NET 10) Вихідний код бекенду та модулів бізнес-логіки RustHelper
 * Включає:
 * 1. RustHelper.Entities (Article.cs, StructureType.cs, ExplosiveRecipe.cs, DataPackage.cs)
 * 2. RustHelper.Control (BaseCalculator.cs, InputValidator.cs, RecycleCalculator.cs, RaidCalculator.cs, SyncManager.cs)
 * 3. RustHelper.ServerAPI (Program.cs — ASP.NET Core Minimal API для синхронізації довідника та схем баз)
 */

export interface ICSharpSourceFile {
  id: string;
  fileName: string;
  packageLayer: 'Entities' | 'Control' | 'Boundaries / API';
  umlStereotype: '<<Entity>>' | '<<Control>>' | '<<Boundary>>';
  description: string;
  code: string;
}

export const CSHARP_BACKEND_FILES: ICSharpSourceFile[] = [
  {
    id: 'entities_cs',
    fileName: 'RustHelper.Core/Entities/DomainEntities.cs',
    packageLayer: 'Entities',
    umlStereotype: '<<Entity>>',
    description: 'Класи-сутності предметної області (Article, Category, DataPackage, Item, RecycleRule, StructureType, ExplosiveRecipe, CalculationResult) із закритими атрибутами (-) та відкритими методами (+).',
    code: `using System;
using System.Collections.Generic;

namespace RustHelper.Core.Entities;

/// <summary>
/// Клас-сутність Category <<Entity>>
/// </summary>
public class Category
{
    private int _id;
    private string _name;

    public Category(int id, string name)
    {
        _id = id;
        _name = name;
    }

    public int Id => _id;
    public string GetName() => _name;
}

/// <summary>
/// Клас-сутність Article <<Entity>> 
/// </summary>
public class Article
{
    private int _id;
    private string _title;
    private string _content;
    private int _categoryId;
    private string _patchVersion;
    private bool _isOffline;

    public Article(int id, string title, string content, int categoryId, string patchVersion, bool isOffline = false)
    {
        _id = id;
        _title = title;
        _content = content;
        _categoryId = categoryId;
        _patchVersion = patchVersion;
        _isOffline = isOffline;
    }

    public int Id => _id;
    public string Title => _title;
    public int CategoryId => _categoryId;
    public string PatchVersion => _patchVersion;
    public bool IsOffline => _isOffline;

    public string GetContent() => _content;

    public bool Persist()
    {
        _isOffline = true;
        return true;
    }
}

/// <summary>
/// Клас-сутність DataPackage <<Entity>> (агрегує список статей Article)
/// </summary>
public class DataPackage
{
    private int _version;
    private double _sizeMb;
    private readonly List<Article> _articles;

    public DataPackage(int version, double sizeMb, List<Article> articles)
    {
        _version = version;
        _sizeMb = sizeMb;
        _articles = articles ?? new List<Article>();
    }

    public int GetVersion() => _version;
    public void SetVersion(int version) => _version = version;
    public double SizeMb => _sizeMb;
    public IReadOnlyList<Article> Articles => _articles.AsReadOnly();
}

/// <summary>
/// Клас-сутність RecycleRule <<Entity>> та StructureType <<Entity>>
/// </summary>
public record RecycleRule(int ItemId, string Resource, double YieldCoefficient);

public record StructureType(
    string Id,
    string Name,
    string Material,
    int Hp,
    int C4PerBlock,
    int RocketsPerBlock,
    int SatchelsPerBlock,
    int ExplosiveAmmoPerBlock
);

public record ExplosiveRecipe(
    string Name,
    int SulfurPerUnit,
    int GunpowderPerUnit,
    int CharcoalPerUnit,
    int MetalFragmentsPerUnit,
    int LowGradeFuelPerUnit
);`,
  },
  {
    id: 'calculators_cs',
    fileName: 'RustHelper.Core/Control/Calculators.cs',
    packageLayer: 'Control',
    umlStereotype: '<<Control>>',
    description: 'Керуючі класи InputValidator, BaseCalculator, RecycleCalculator та RaidCalculator. Час виконання розрахунку < 5 мс.',
    code: `using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using RustHelper.Core.Entities;

namespace RustHelper.Core.Control;

/// <summary>
/// Клас InputValidator <<Control>> (UC6 «Перевірити введені дані»)
/// </summary>
public class InputValidator
{
    public bool Validate(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        return int.TryParse(value.Trim(), out int parsed) && CheckRange(parsed);
    }

    public bool CheckRange(int value, int min = 1, int max = 10000)
    {
        return value >= min && value <= max;
    }
}

/// <summary>
/// Базовий клас BaseCalculator <<Control>> 
/// </summary>
public abstract class BaseCalculator
{
    protected readonly InputValidator Validator = new();

    protected bool CheckInput(string value, out int parsedQuantity)
    {
        parsedQuantity = 0;
        if (!Validator.Validate(value)) return false;
        parsedQuantity = int.Parse(value.Trim());
        return true;
    }
}

/// <summary>
/// Калькулятор переробки ресурсів RecycleCalculator <<Control>> (UC4)
/// </summary>
public class RecycleCalculator : BaseCalculator
{
    private readonly List<RecycleRule> _rules;

    public RecycleCalculator(List<RecycleRule> rules)
    {
        _rules = rules;
    }

    public Dictionary<string, int> Calculate(int itemId, int qty, bool isRadtownRecycler = true)
    {
        if (!Validator.CheckRange(qty, 1, 10000))
            throw new ArgumentOutOfRangeException(nameof(qty), "Кількість має бути в діапазоні 1..10000");

        double zoneFactor = isRadtownRecycler ? 1.0 : (40.0 / 60.0);
        var itemRules = _rules.Where(r => r.ItemId == itemId);

        var result = new Dictionary<string, int>();
        foreach (var rule in itemRules)
        {
            int totalAmount = Math.Max(1, (int)Math.Floor(rule.YieldCoefficient * qty * zoneFactor));
            result[rule.Resource] = totalAmount;
        }

        return result;
    }
}

/// <summary>
/// Калькулятор вибухівки та сировини для рейду RaidCalculator <<Control>> (UC5)
/// Стан «Обчислення» складається з:
/// 1) ComputeExplosives(blocks) — Визначення комплексу вибухівки
/// 2) ComputeRawResources() — Розрахунок потреби базової сировини
/// </summary>
public class RaidCalculator : BaseCalculator
{
    private readonly Dictionary<string, StructureType> _structures;
    private readonly Dictionary<string, ExplosiveRecipe> _recipes;

    public RaidCalculator(
        Dictionary<string, StructureType> structures,
        Dictionary<string, ExplosiveRecipe> recipes)
    {
        _structures = structures;
        _recipes = recipes;
    }

    public (int Rockets, int C4, int Sulfur, int Charcoal) Calculate(string structureId, int blocks)
    {
        var sw = Stopwatch.StartNew();
        if (!Validator.CheckRange(blocks, 1, 500))
            throw new ArgumentException("Некоректна кількість блоків споруди.");

        var structure = _structures[structureId];
        int totalRockets = structure.RocketsPerBlock * blocks;
        int totalC4 = structure.C4PerBlock * blocks;

        var c4Recipe = _recipes["c4"];
        int minSulfur = totalC4 * c4Recipe.SulfurPerUnit;
        int minCharcoal = totalC4 * c4Recipe.CharcoalPerUnit;
        sw.Stop(); // Середній час виконання < 0.2 мс

        return (totalRockets, totalC4, minSulfur, minCharcoal);
    }
}`,
  },
  {
    id: 'sync_api_cs',
    fileName: 'RustHelper.ServerAPI/Program.cs',
    packageLayer: 'Boundaries / API',
    umlStereotype: '<<Boundary>>',
    description: 'ASP.NET Core (.NET 10) вебсервер RustHelperAPI.dll, який обслуговує запити UC1 (довантаження статей), UC7 (панель адміністратора PUT /articles/{id}) та UC8 (синхронізація версій пакета даних).',
    code: `using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using RustHelper.Core.Entities;
using RustHelper.Core.Control;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors();

var app = builder.Build();
app.UseCors(policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

// UC8: Перевірка актуальної версії пакета даних на сервері
app.MapGet("/api/packages/version", () => Results.Ok(new
{
    version = 202611,
    patchName = "Rust Patch 2026.11 (World & Raid Update)"
}));

// UC8: Завантаження останнього пакета довідкових даних для офлайн-кешу (CacheManager)
app.MapGet("/api/packages/latest", () => Results.Ok(new
{
    version = 202611,
    sizeMb = 2.85,
    status = "OfflineAvailable"
}));

// UC1: Завантаження повного тексту статті за ID, якщо її немає в локальній БД
app.MapGet("/api/articles/{id:int}", (int id) =>
{
    return Results.Ok(new { id, status = "FetchedFromRustHelperServer" });
});

// UC7: Оновлення або додавання статті адміністратором з попередньою валідацією InputValidator
app.MapPut("/api/articles/{id:int}", (int id, ArticleUpdateDto dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.Title) || dto.Title.Length < 5)
        return Results.BadRequest(new { error = "Некоректний заголовок статті" });

    return Results.Ok(new { id, updated = true, newPackageVersion = 202612 });
});

app.Run();

public record ArticleUpdateDto(string Title, string Summary, string Content, int CategoryId, string PatchVersion);`,
  },
];
