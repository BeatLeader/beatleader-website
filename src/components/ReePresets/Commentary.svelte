<script>
	import 'suneditor/dist/css/suneditor.min.css';
	import Comment from '../Leaderboard/Comments/Comment.svelte';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import Button from '../Common/Button.svelte';
	import CommentRedactor from '../Leaderboard/Comments/CommentRedactor.svelte';

	export let preset;
	export let currentPlayerId;
	let comments;
	let writing = false;

	function fetchComments(preset) {
		comments = preset.comments;
	}

	async function postComment(event) {
		fetch(BL_API_URL + 'preset/comment/' + preset.id, {
			method: 'POST',
			credentials: 'include',
			body: event.detail,
			headers: {'Content-Type': 'application/json'},
		})
			.then(r => r.json())
			.then(newComment => {
				comments.push(newComment);
				comments = comments;
			});
	}

	async function editComment(event) {
		fetch(BL_API_URL + 'preset/comment/' + event.detail.id, {
			method: 'PUT',
			credentials: 'include',
			body: event.detail.value,
			headers: {'Content-Type': 'application/json'},
		})
			.then(r => r.json())
			.then(newComment => {
				var comment = comments.find(c => c.id == newComment.id);
				comment.value = newComment.value;
				comment.edited = newComment.edited;
				comment.editTimeset = newComment.editTimeset;

				comments = comments;
			});
	}

	async function deleteComment(event) {
		fetch(BL_API_URL + 'preset/comment/' + event.detail, {
			method: 'DELETE',
			credentials: 'include',
		}).then(r => {
			if (r.status == 200) {
				comments = comments.filter(c => c.id != event.detail);
			}
		});
	}

	$: preset && fetchComments(preset);
</script>

{#if currentPlayerId}
	{#if writing}
		<CommentRedactor on:post={postComment} on:cancel={() => (writing = false)} />
	{:else}
		<div class="button-and-link">
			<Button label="Write" iconFa="fas fa-edit" on:click={() => (writing = true)} />
		</div>
	{/if}
{/if}

{#if Array.isArray(comments)}
	{#each comments as comment}
		<Comment {comment} {currentPlayerId} on:edit={editComment} on:delete={deleteComment} />
	{/each}
{/if}

<style>
	.button-and-link {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1em;
	}
</style>
