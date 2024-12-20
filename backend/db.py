from config import DB_MODULES, DB_PATH
from tortoise import Tortoise, fields
from tortoise.models import Model


class Tournament(Model):
    id = fields.IntField(primary_key=True)
    name = fields.TextField()
    lichess_id = fields.CharField(max_length=16, unique=True)
    is_finished = fields.BooleanField(default=False, index=True)
    is_hidden = fields.BooleanField(default=False)
    time_control = fields.TextField(null=True)


class Game(Model):
    id = fields.IntField(primary_key=True)
    tournament = fields.ForeignKeyField(
        model_name="lc0live.Tournament", related_name="games", index=True
    )
    game_name = fields.TextField()
    lichess_round_id = fields.CharField(max_length=16)
    lichess_id = fields.CharField(max_length=16, unique=True)
    round_name = fields.TextField()
    player1_name = fields.TextField()
    player1_fide_id = fields.IntField(null=True)
    player1_rating = fields.IntField(null=True)
    player1_fed = fields.CharField(max_length=3, null=True)
    player2_name = fields.TextField()
    player2_fide_id = fields.IntField(null=True)
    player2_rating = fields.IntField(null=True)
    player2_fed = fields.CharField(max_length=3, null=True)
    status = fields.CharField(max_length=4)
    is_finished = fields.BooleanField(default=False, index=True)
    is_hidden = fields.BooleanField(default=False, index=True)


class GameFilter(Model):
    game = fields.ForeignKeyField(model_name="lc0live.Game", related_name="filters")
    key = fields.TextField()
    value = fields.TextField()


# pyright: reportIncompatibleVariableOverride=false
class GamePosition(Model):
    id = fields.IntField(primary_key=True)
    game = fields.ForeignKeyField(
        model_name="lc0live.Game", related_name="positions", index=True
    )
    # Zero for startpos, 2×move-1 after white move, 2×move after black move.
    ply_number = fields.IntField(index=True)
    fen = fields.TextField()
    move_uci = fields.CharField(max_length=5, null=True)
    move_san = fields.CharField(max_length=10, null=True)
    # Zero-based ply number
    white_clock = fields.IntField(null=True)
    black_clock = fields.IntField(null=True)
    nodes = fields.IntField()
    q_score = fields.IntField()
    white_score = fields.IntField()
    draw_score = fields.IntField()
    black_score = fields.IntField()
    moves_left = fields.IntField(null=True)
    time = fields.IntField(null=True)
    depth = fields.IntField(null=True)
    seldepth = fields.IntField(null=True)

    class Meta:
        unique_together: tuple[tuple[str, str]] = (("game", "ply_number"),)
        indexes: tuple[tuple[str, str]] = (("game", "ply_number"),)


class GamePositionEvaluation(Model):
    id = fields.IntField(primary_key=True)
    position = fields.ForeignKeyField(
        model_name="lc0live.GamePosition", related_name="evaluations", index=True
    )
    nodes = fields.IntField()
    time = fields.IntField()
    depth = fields.IntField()
    seldepth = fields.IntField()
    moves_left = fields.IntField(null=True)


class GamePositionEvaluationMove(Model):
    id = fields.IntField(primary_key=True)
    evaluation = fields.ForeignKeyField(
        model_name="lc0live.GamePositionEvaluation", related_name="pv", index=True
    )
    evaluation_id: int
    nodes = fields.IntField()
    q_score = fields.IntField()
    pv_san = fields.TextField()
    pv_uci = fields.TextField()
    mate_score = fields.IntField(null=True)
    white_score = fields.IntField()
    draw_score = fields.IntField()
    black_score = fields.IntField()
    moves_left = fields.IntField(null=True)


async def init():
    await Tortoise.init(
        db_url=DB_PATH,
        modules=DB_MODULES,
    )
    await Tortoise.generate_schemas()
