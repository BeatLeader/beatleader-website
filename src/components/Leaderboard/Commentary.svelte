<script>
	import 'suneditor/dist/css/suneditor.min.css';
	import Comment from './Comments/Comment.svelte';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import CommentRedactor from './Comments/CommentRedactor.svelte';
	import Button from '../Common/Button.svelte';

	export let qualification;
	export let currentPlayerId;
	export let isNQT;
	export let mapperId;

	let comments;
	let writing = false;

	function fetchComments(qualification) {
		comments = qualification.comments;
	}

	async function postComment(event) {
		fetch(BL_API_URL + 'qualification/comment/' + qualification.id, {
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
		fetch(BL_API_URL + 'qualification/comment/' + event.detail.id, {
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
		fetch(BL_API_URL + 'qualification/comment/' + event.detail, {
			method: 'DELETE',
			credentials: 'include',
		}).then(r => {
			if (r.status == 200) {
				comments = comments.filter(c => c.id != event.detail);
			}
		});
	}

	$: fetchComments(qualification);
</script>

{#if mapperId || isNQT}
	{#if writing}
		<CommentRedactor on:post={postComment} on:cancel={() => (writing = false)} />
	{:else}
		<div class="button-and-link">
			{#if isNQT}
				<a href="https://discord.com/channels/921820046345523311/{qualification.discordChannelId}"> Discord Forum </a>
			{/if}
			<Button label="Write" iconFa="fas fa-edit" on:click={() => (writing = true)} />
		</div>
	{/if}
{/if}

{#each comments as comment}
	<Comment {comment} {currentPlayerId} on:edit={editComment} on:delete={deleteComment} />
{/each}

<style>
	.button-and-link {
		display: inline-grid;
	}
</style>
