<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterGoalData;
use App\DTOs\UpdateGoalData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreGoalRequest;
use App\Http\Requests\Api\UpdateGoalRequest;
use App\Http\Resources\GoalResource;
use App\Models\Context;
use App\Models\Goal;
use App\UseCases\Goal\CreateGoal;
use App\UseCases\Goal\UpdateGoal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Metas financeiras (capítulo 9.7, D-13). Progresso (`current_amount`)
 * não se edita aqui — ver docblock de {@see Goal}.
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
final class GoalController extends Controller
{
    public function index(Context $context): AnonymousResourceCollection
    {
        return GoalResource::collection($context->goals()->orderBy('target_date')->get());
    }

    public function store(StoreGoalRequest $request, Context $context, CreateGoal $useCase): GoalResource
    {
        return new GoalResource($useCase->execute(new RegisterGoalData(
            contextId: $context->id,
            name: $request->string('name')->toString(),
            targetAmount: (float) $request->input('target_amount'),
            targetDate: $request->input('target_date'),
            notes: $request->input('notes'),
        )));
    }

    public function update(UpdateGoalRequest $request, Context $context, Goal $goal, UpdateGoal $useCase): GoalResource
    {
        return new GoalResource($useCase->execute($goal, new UpdateGoalData(
            name: $request->string('name')->toString(),
            targetAmount: (float) $request->input('target_amount'),
            targetDate: $request->input('target_date'),
            notes: $request->input('notes'),
        )));
    }

    public function destroy(Context $context, Goal $goal): JsonResponse
    {
        $goal->delete();

        return response()->json(status: 204);
    }
}
