// milestone-path-traversal.test.js — verifies the path-traversal guard
// added to milestone-service.js after the security audit. The previous
// implementation joined user-controlled printerId/filename onto the
// MILESTONE_DIR with no boundary check, so a request like
// /api/milestones/../../../etc/passwd could escape the directory.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getMilestoneFile, getArchivedMilestoneFile } from '../../server/milestone-service.js';

describe('milestone path traversal guard', () => {
  it('getMilestoneFile() rejects ../ traversal in printerId', () => {
    assert.equal(getMilestoneFile('../../etc', 'passwd'), null);
  });

  it('getMilestoneFile() rejects ../ traversal in filename', () => {
    assert.equal(getMilestoneFile('p1', '../../../etc/passwd'), null);
  });

  it('getMilestoneFile() rejects absolute path in filename', () => {
    assert.equal(getMilestoneFile('p1', '/etc/passwd'), null);
  });

  it('getArchivedMilestoneFile() rejects ../ traversal', () => {
    assert.equal(getArchivedMilestoneFile('123', '../../../etc/passwd'), null);
  });

  it('getArchivedMilestoneFile() rejects absolute path', () => {
    assert.equal(getArchivedMilestoneFile('123', '/etc/passwd'), null);
  });
});
