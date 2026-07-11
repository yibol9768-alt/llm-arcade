// GET /api/arcade-index
// Composite leaderboard: method weights within each track, then track weights across tracks.
import { jsonResponse, errorResponse } from "../_lib/http.js";
import { getActiveParticipants, getVotesForTrack } from "../_lib/db.js";
import { computeElo, tallyRecords } from "../_lib/rating.js";
import { aggregateCompleteRankings } from "../_lib/ranking.js";
import { eloToArcadeScore, averageRankToScore, combineMethodScores } from "../_lib/index-score.js";
import { INDEX_METHOD_WEIGHTS, INDEX_ROSTER, INDEX_TRACKS } from "../_lib/index-config.js";

async function rankingBallots(db, track) {
  const { results } = await db.prepare(
    "SELECT ranking_json FROM ranking_ballots WHERE track = ?1 ORDER BY updated_at, voter_hash",
  ).bind(track).all();
  return results.map((row) => {
    try { return JSON.parse(row.ranking_json); } catch { return null; }
  }).filter(Boolean);
}

export async function onRequestGet(context) {
  try {
    const tracks = [];
    for (const config of INDEX_TRACKS) {
      const [dirs, votes, ballots] = await Promise.all([
        getActiveParticipants(context.env.DB, config.id),
        getVotesForTrack(context.env.DB, config.id),
        rankingBallots(context.env.DB, config.id),
      ]);
      const elo = computeElo(votes, dirs);
      const records = tallyRecords(votes, dirs);
      const ranking = aggregateCompleteRankings(ballots, dirs);
      const rankingByDir = new Map(ranking.entries.map((entry) => [entry.dir, entry]));
      const active = dirs.length >= 2 && (votes.length > 0 || ranking.total_ballots > 0);
      const entries = {};
      for (const model of INDEX_ROSTER) {
        const dir = config.dirs[model.key];
        const participant = dirs.includes(dir);
        const record = participant ? records.get(dir) : null;
        const rankEntry = participant ? rankingByDir.get(dir) : null;
        const methods = [
          {
            id: "elo",
            weight: INDEX_METHOD_WEIGHTS.elo,
            score: active && record && record.games > 0 ? eloToArcadeScore(elo.get(dir)) : null,
          },
          {
            id: "complete_ranking",
            weight: INDEX_METHOD_WEIGHTS.complete_ranking,
            score: active && ranking.total_ballots > 0 && rankEntry
              ? averageRankToScore(rankEntry.average_rank, dirs.length) : null,
          },
        ];
        const combined = combineMethodScores(methods);
        entries[model.key] = {
          dir,
          participant,
          score: combined.score,
          provisional: combined.score === null || !(record && record.games > 0) || ranking.total_ballots === 0,
          effective_method_weights: combined.effective_weights,
          elo: participant ? Math.round((elo.get(dir) || 1000) * 10) / 10 : null,
          games: record ? record.games : 0,
          average_rank: Number.isFinite(rankEntry?.average_rank)
            ? Math.round(rankEntry.average_rank * 1000) / 1000 : null,
        };
      }
      tracks.push({
        id: config.id,
        name: config.name,
        planned_weight: config.planned_weight,
        active,
        participant_count: dirs.length,
        pairwise_votes: votes.length,
        complete_ballots: ranking.total_ballots,
        entries,
      });
    }

    const activeTracks = tracks.filter((track) => track.active);
    const activeWeight = activeTracks.reduce((sum, track) => sum + track.planned_weight, 0);
    tracks.forEach((track) => { track.effective_weight = track.active && activeWeight ? track.planned_weight / activeWeight : 0; });

    const entries = INDEX_ROSTER.map((model) => {
      let score = 0;
      let provisional = false;
      const details = {};
      for (const track of tracks) {
        const entry = track.entries[model.key];
        const trackScore = entry.score === null ? 50 : entry.score;
        if (track.active && entry.provisional) provisional = true;
        if (track.active) score += trackScore * track.effective_weight;
        details[track.id] = { ...entry, score: trackScore };
      }
      return { key: model.key, dir: model.primary_dir, score, provisional, tracks: details };
    }).sort((a, b) => b.score - a.score || Number(a.provisional) - Number(b.provisional) || a.key.localeCompare(b.key));

    return jsonResponse({
      generated_at: Math.floor(Date.now() / 1000),
      method_weights: INDEX_METHOD_WEIGHTS,
      active_track_count: activeTracks.length,
      total_judgments: tracks.reduce((sum, track) => sum + track.pairwise_votes + track.complete_ballots, 0),
      tracks,
      entries,
    }, 200, { "Cache-Control": "public, max-age=30" });
  } catch (error) {
    console.error("index error:", error);
    return errorResponse("internal", "internal error", 500);
  }
}
