## 背景

./ghostコマンドを用いたissueベースで仕事を進めていく

issueは下記の属性を持つ

- title: 人間が分かりやすいように簡潔かつ明瞭な1文を記す
- description:
    - WHY, WHATを記述。HOWは書かない
    - WHY: このissueを解くべき理由を簡潔に記す
    - WHAT: 解き方を方針レベルで書いておく。(HOWまで書きすぎると柔軟性が損なわれるのであくまでWHATレベルまで)
    - RELATED: 関連issue, このissueが解決しないと解けない問題、
    - 自分以外の人がこの問題に取り組んでも問題ないように、背景知識をdescriptionにかく。
- status
    - plan: 内容を精緻化する前
    - backlog: 進行可能なissue。ただし、依存が解消されていない可能性あり
    - in progress: 進行中
    - in review: レビュー中のもの
    - done: 完了したタスク

## 概要

精緻化されたissue（backlogステータス）を実際に解決していく。
優先度の高いものから着手し、完了後はレビューフェーズに移行する。

## issueの実行手順

1. **作業可能なissueの確認**
   ```bash
   # 作業可能なissue一覧を確認
   ./ghost issue available
   
   # 特定のissueの詳細を確認
   ./ghost issue show <issueId>
   ```

2. **作業の開始**
   ```bash
   # worktreeを作成して作業開始
   ./ghost issue take <issueId>
   
   # ステータスをin_progressに更新
   ./ghost issue update <issueId> --status in_progress
   ```

3. **実装作業**
   - descriptionに記載されたWHATに基づいて実装
   - 必要に応じてコードベースを調査
   - テストの作成・実行
   - リントやタイプチェックの実行

4. **作業中の管理**
   - 大きなタスクは必要に応じて子issueに分割
   ```bash
   ./ghost create "サブタスク" --parent <issueId> --description "詳細"
   ```
   - 進捗状況を定期的に確認
   ```bash
   ./ghost list
   ```

5. **作業完了後**
   ```bash
   # レビューフェーズに移行
   ./ghost issue update <issueId> --status in_review

   # 子issueがある場合は、それらも適切に更新
   ./ghost list --parent <issueId>
   ```

## 実装時の注意事項

- 実装の詳細（HOW）は柔軟に判断
- テストを必ず作成・実行
- コードの品質チェック（lint、typecheck）を忘れない
- 完了の定義を満たしてからin_reviewに移行

## 優先順位の判断基準

1. 依存関係が解消されているもの
2. ブロッカーとなっているissue
3. ユーザーへの影響が大きいもの
4. 実装の難易度と所要時間のバランス
