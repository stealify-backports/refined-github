import React from 'dom-chef';
import select from 'select-dom';
import elementReady from 'element-ready';
import * as pageDetect from 'github-url-detection';
import delegate, {DelegateEvent} from 'delegate-it';

import features from '.';
import onDiscussionSidebarUpdate from '../github-events/on-discussion-sidebar-update';

async function addSidebarReviewButton(): Promise<void | false> {
	const reviewFormUrl = new URL(location.href);
	reviewFormUrl.pathname += '/files';
	reviewFormUrl.hash = 'submit-review';

	const sidebarReviewsSection = await elementReady('[aria-label="Select reviewers"] .discussion-sidebar-heading');
	if (select.exists('[data-hotkey="v"]', sidebarReviewsSection)) {
		return false;
	}

	sidebarReviewsSection!.append(
		<span className="text-normal">
			– <a href={reviewFormUrl.href} className="btn-link Link--muted" data-hotkey="v" data-pjax="#repo-content-pjax-container">review now</a>
		</span>,
	);
}

function focusReviewTextarea({delegateTarget}: DelegateEvent<Event, HTMLDetailsElement>): void {
	if (delegateTarget.open) {
		select('textarea', delegateTarget)!.focus();
	}
}

async function initReviewButtonEnhancements(signal: AbortSignal): Promise<void> {
	delegate(document, '.js-reviews-container > details', 'toggle', focusReviewTextarea, {capture: true, signal});

	const reviewDropdownButton = await elementReady('.js-reviews-toggle');
	if (reviewDropdownButton) {
		reviewDropdownButton.dataset.hotkey = 'v';

		// This feature should be native but isn't currently working #3681
		if (location.hash === '#submit-review') {
			reviewDropdownButton.click();
		}
	}
}

void features.add(import.meta.url, {
	include: [
		pageDetect.isPRConversation,
	],
	additionalListeners: [
		onDiscussionSidebarUpdate,
	],
	awaitDomReady: false,
	deduplicate: 'has-rgh-inner',
	init: addSidebarReviewButton,
}, {
	shortcuts: {
		v: 'Open PR review popup',
	},
	include: [
		pageDetect.isPRFiles,
	],
	awaitDomReady: false,
	deduplicate: 'has-rgh-inner',
	init: initReviewButtonEnhancements,
});
