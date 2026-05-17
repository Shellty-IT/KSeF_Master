using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace KSeF.Backend.Controllers;

[ApiController]
public abstract class BaseApiController : ControllerBase
{
    protected int? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }
}
