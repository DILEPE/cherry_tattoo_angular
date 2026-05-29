import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { SurveyQuestionsAdminApiService } from './services/survey-questions-admin-api.service';
import { SurveyQuestion } from './models/survey-question.model';
import { apiErrorMessage } from '../../core/services/api.service';

interface SurveysState {
  items: SurveyQuestion[];
  loading: boolean;
  error: string | null;
  reordering: boolean;
  reloadToken: number;
}

const initialState: SurveysState = {
  items: [],
  loading: false,
  error: null,
  reordering: false,
  reloadToken: 0,
};

function sortQuestions(items: SurveyQuestion[]): SurveyQuestion[] {
  return [...items].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id - b.id,
  );
}

export const SurveysStore = signalStore(
  withState(initialState),
  withComputed(({ items }) => {
    const active = computed(() =>
      sortQuestions(items().filter((q) => q.isActive)),
    );
    const inactive = computed(() =>
      sortQuestions(items().filter((q) => !q.isActive)),
    );
    return { active, inactive };
  }),
  withMethods((store, api = inject(SurveyQuestionsAdminApiService)) => ({
    refresh(): void {
      patchState(store, { reloadToken: store.reloadToken() + 1 });
    },
    invalidate(): void {
      patchState(store, { reloadToken: store.reloadToken() + 1 });
    },
    moveUp(q: SurveyQuestion): void {
      const active = store.active();
      const idx = active.findIndex((x) => x.id === q.id);
      if (idx <= 0) return;
      const prev = active[idx - 1];
      patchState(store, { reordering: true });
      api.swapSortOrder(q, prev).subscribe({
        next: () => {
          patchState(store, { reordering: false, reloadToken: store.reloadToken() + 1 });
        },
        error: () => patchState(store, { reordering: false }),
      });
    },
    moveDown(q: SurveyQuestion): void {
      const active = store.active();
      const idx = active.findIndex((x) => x.id === q.id);
      if (idx < 0 || idx >= active.length - 1) return;
      const next = active[idx + 1];
      patchState(store, { reordering: true });
      api.swapSortOrder(q, next).subscribe({
        next: () => {
          patchState(store, { reordering: false, reloadToken: store.reloadToken() + 1 });
        },
        error: () => patchState(store, { reordering: false }),
      });
    },
    activate(q: SurveyQuestion): void {
      api.update(q.id, { is_active: true }).subscribe({
        next: () =>
          patchState(store, { reloadToken: store.reloadToken() + 1 }),
      });
    },
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() => api.list(true)),
        tapResponse({
          next: (list) => patchState(store, { items: list, loading: false }),
          error: (err) =>
            patchState(store, {
              items: [],
              loading: false,
              error: apiErrorMessage(err),
            }),
        }),
      ),
    ),
  })),
);
