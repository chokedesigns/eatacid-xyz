"""Mechanical checks only; callers independently validate evidence and ordinary gates.

No file/Git access, writes, admission issuance, reconciliation or synthesis execution.
Exact summary token boundaries follow the existing preparation helper's policy.
"""
import hashlib
import re

PROTOCOL = 'EA-XYZ-DIAGNOSTIC-ADMISSION-v1'
CLASSIFICATION = 'non-finding repository change provenance'
OBLIGATIONS = (
    'original_authorization', 'immutable_identity', 'sealed_evidence',
    'nonfinding_rationale', 'formal_nonduplication', 'current_authority', 'continuity',
)
SCOPE = {
    'e13a427df23b5525cc00afff8466a42e54fd179f': (
        'DIAG-EA-XYZ-PRE6-003', 'CAND-DCR-003',
        'e2a320cc76cb45f6713ace2413eb5bce5ffeb8b8',
        'DIAG-EA-XYZ-PRE6-003: guard Treasury requests after session invalidation'),
    'b871d14ca275611f01eaa3294065736aadf6bc1d': (
        'DIAG-EA-XYZ-PRE6-001', 'CAND-DCR-001',
        'e13a427df23b5525cc00afff8466a42e54fd179f',
        'DIAG-EA-XYZ-PRE6-001: own asynchronous Pause publications'),
    '10af957d3cc29a6defaaf955b0d697a0ae74a420': (
        'DIAG-EA-XYZ-PRE6-002', 'CAND-DCR-002',
        'b871d14ca275611f01eaa3294065736aadf6bc1d',
        'DIAG-EA-XYZ-PRE6-002: reject malformed Pause storage evidence'),
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def present(value):
    return isinstance(value, str) and value.strip() not in ('', 'NONE', 'UNTRACED')


def full_hash(value, length=40):
    return isinstance(value, str) and re.fullmatch(r'[0-9a-f]{' + str(length) + '}', value) is not None


def exact_tickets(summary, ticket_ids):
    return [ticket for ticket in ticket_ids if re.search(
        r'(?<![A-Za-z0-9-])' + re.escape(ticket) + r'(?![A-Za-z0-9-])', summary)]


def validate_bundle(bundle, context, entries):
    """Reject missing/conflicting structure; human evidence validation remains mandatory."""
    errors = []

    def require(condition, message):
        if not condition:
            errors.append(message)

    require(bundle.get('protocol') == PROTOCOL, 'protocol identity')
    require(type(bundle.get('edition')) is int and bundle['edition'] > 0, 'bundle edition')
    require(bundle.get('prior_edition') == 'NONE' or present(bundle.get('prior_edition')), 'prior edition reference')
    if bundle.get('edition') != 1:
        require(bundle.get('prior_edition') != 'NONE', 'later edition without prior reference')
    require(bundle.get('current_authority') == 'YES', 'not current authority')
    for field in ('protocol_sha256', 'owner_decision_sha256', 'consumer_sha256', 'execution_sha256'):
        require(full_hash(context.get(field), 64) and bundle.get(field) == context.get(field), field)
    actors = bundle.get('actors', {})
    actor_names = ('producer', 'implementation_author', 'reviewer', 'consumer')
    require(set(actors) == set(actor_names) and all(present(actors.get(n)) for n in actor_names), 'appointed actors missing')
    require(actors == context.get('actors'), 'actors not bound to execution decision')
    require(actors.get('reviewer') not in (actors.get('producer'), actors.get('implementation_author')), 'reviewer conflict')
    require(actors.get('consumer') not in (actors.get('producer'), actors.get('implementation_author'), actors.get('reviewer')), 'consumer independence')
    sources = bundle.get('sources', [])
    source_ids = [s.get('id') for s in sources]
    require(all(present(s) for s in source_ids) and len(source_ids) == len(set(source_ids)), 'source identities duplicate/missing')
    evidence = context.get('evidence', {})
    for source in sources:
        data = evidence.get(source.get('id'))
        require(present(source.get('path')) and present(source.get('purpose')), 'source path/purpose')
        require(isinstance(data, bytes) and type(source.get('bytes')) is int and
                len(data) == source['bytes'] and digest(data) == source.get('sha256'),
                'source seal: ' + str(source.get('id')))
    for field in ('protocol_sha256', 'owner_decision_sha256', 'execution_sha256'):
        require(any(s.get('sha256') == context.get(field) for s in sources), 'missing authority source: ' + field)

    def refs_valid(refs, allowed=None):
        return isinstance(refs, list) and bool(refs) and all(
            isinstance(ref, dict) and ref.get('source') in source_ids and present(ref.get('locator'))
            and (allowed is None or ref in allowed) for ref in refs)

    records = bundle.get('records', [])
    keys = [r.get('key') for r in records]
    require(len(keys) == len(set(keys)), 'duplicate record key')
    require(len(records) == len(SCOPE) and {r.get('commit') for r in records} == set(SCOPE), 'complete scoped candidate accounting')
    reviews = bundle.get('consumer_reviews', {})
    require(set(reviews) == set(keys), 'orphan/missing consumer review')
    linked = set()
    for record in records:
        key = record.get('key')
        commit = record.get('commit')
        prefix = str(key) + ': '
        identity = SCOPE.get(commit)
        if identity is None:
            require(False, prefix + 'out of scope')
            continue
        diag, candidate, parent, summary = identity
        root = context.get('roots', {}).get('admin-ui')
        require(present(root) and record.get('repository') == 'admin-ui' and record.get('root') == root, prefix + 'repository/root')
        require(record.get('diag_id') == diag and record.get('candidate_id') == candidate, prefix + 'DIAG/CAND identity')
        require(key == str(root) + '|' + commit + '|' + diag, prefix + 'stable key')
        require(record.get('parents') == [parent] and record.get('summary') == summary and full_hash(record.get('tree')), prefix + 'immutable tuple')
        matches = [e for e in entries if e.get('repository') == 'admin-ui' and e.get('commit') == commit]
        require(len(matches) == 1, prefix + 'orphan/duplicate log link')
        if len(matches) == 1:
            entry = matches[0]
            require(all(record.get(f) == entry.get(f) for f in ('summary', 'parents', 'tree')), prefix + 'log tuple mismatch')
            linked.add(('admin-ui', commit))
        require(type(record.get('edition')) is int and record['edition'] > 0, prefix + 'record edition')
        require(record.get('prior_record') == 'NONE' or present(record.get('prior_record')), prefix + 'prior record reference')
        if record.get('edition') != 1:
            require(record.get('prior_record') != 'NONE', prefix + 'later record without prior reference')
        require(record.get('revocation') == 'NONE', prefix + 'revoked')
        require(record.get('original_formal_association') == 'UNTRACED', prefix + 'original formal association')
        require(isinstance(record.get('historical_unresolved_refs'), list) and bool(record['historical_unresolved_refs']) and all(present(x) for x in record['historical_unresolved_refs']), prefix + 'historical unresolved references')
        require(present(record.get('rationale')) and present(record.get('limitations')), prefix + 'rationale/limits')
        require(isinstance(record.get('gaps'), list), prefix + 'explicit gaps required')
        decision = record.get('decision')
        require(decision in ('ADMIT', 'REJECT', 'UNRESOLVED'), prefix + 'decision')
        require(record.get('classification') == (CLASSIFICATION if decision == 'ADMIT' else 'NOT_ESTABLISHED'), prefix + 'classification')
        if decision == 'ADMIT':
            require(record.get('gaps') == [], prefix + 'ADMIT with gaps')
        else:
            require(bool(record.get('gaps')), prefix + 'negative decision without reason/gap')
        evidence_refs = record.get('evidence_refs', {})
        for obligation in OBLIGATIONS:
            require(refs_valid(evidence_refs.get(obligation)), prefix + 'evidence refs: ' + obligation)
        for label, review, actor in (
            ('admission', record.get('review', {}), actors.get('reviewer')),
            ('consumer', reviews.get(key, {}), actors.get('consumer')),
        ):
            require(present(actor) and review.get('actor') == actor and present(review.get('date')) and present(review.get('reason')), prefix + label + ' reviewer/date/reason')
            require(review.get('decision') in ('ADMIT', 'REJECT', 'UNRESOLVED'), prefix + label + ' decision')
            if label == 'admission':
                require(review.get('decision') == decision, prefix + 'admission decision mismatch')
            checks = review.get('checks', {})
            require(set(checks) == set(OBLIGATIONS), prefix + label + ' obligation set')
            for obligation in OBLIGATIONS:
                check = checks.get(obligation, {})
                require(check.get('result') in ('PASS', 'FAIL') and present(check.get('reason')) and
                        refs_valid(check.get('evidence_refs'), evidence_refs.get(obligation, [])),
                        prefix + label + ' check: ' + obligation)
                if review.get('decision') == 'ADMIT':
                    require(check.get('result') == 'PASS', prefix + label + ' ADMIT with failed check')
    require(linked == {('admin-ui', c) for c in SCOPE}, 'reverse record/log coverage')
    return errors


def account(entries, ticket_ids, consumer, mode, bundle=None, context=None, *, log_complete=False):
    """Return two independent axes; never change supplied ticket records or decisions.

    Fail-closed global validation prevents positive diagnostic use of a broken packet.
    Valid negative decisions stay visible individually and block resolved accounting.
    """
    if not log_complete:
        raise ValueError('complete reconcilable log preflight required; retain UNTRACED')
    if len(ticket_ids) != len(set(ticket_ids)) or not all(present(t) for t in ticket_ids):
        raise ValueError('unique exact checklist identities required')
    seen = set()
    for entry in entries:
        key = (entry.get('repository'), entry.get('commit'))
        if not present(key[0]) or not full_hash(key[1]) or key in seen or not isinstance(entry.get('summary'), str):
            raise ValueError('invalid/duplicate complete-log entry')
        seen.add(key)
    rows = []
    ticket_commits = {t: [] for t in ticket_ids}
    errors = []
    context = context or {}
    if bundle is not None:
        if (consumer, mode) not in (('REC', 'REMEDIATION_RECONCILIATION'), ('TRACE', 'PHASE_3_RERUN')):
            raise ValueError('diagnostic input not declared for this mode')
        try:
            errors = validate_bundle(bundle, context, entries)
        except (AttributeError, KeyError, TypeError, ValueError) as error:
            errors = ['malformed diagnostic packet: ' + type(error).__name__]
    records = {(r.get('repository'), r.get('commit')): r for r in bundle.get('records', []) if isinstance(r, dict)} if isinstance(bundle, dict) and isinstance(bundle.get('records', []), list) else {}
    for entry in entries:
        key = (entry['repository'], entry['commit'])
        tickets = exact_tickets(entry['summary'], ticket_ids)
        for ticket in tickets:
            ticket_commits[ticket].append(key)
        record = records.get(key)
        accepted = bool(record and not errors and record['decision'] == 'ADMIT' and
                        bundle['consumer_reviews'][record['key']]['decision'] == 'ADMIT')
        rows.append({
            'repository': key[0], 'commit': key[1], 'formal_tickets': tickets,
            'original_formal_association': tickets or 'UNTRACED',
            'diagnostic_key': record.get('key') if record else None,
            'diagnostic_decision': record.get('decision') if record else 'UNRESOLVED',
            'classification': CLASSIFICATION if accepted and not tickets else 'NOT_ESTABLISHED',
            'accounting': 'FORMAL' if tickets else CLASSIFICATION if accepted else 'UNTRACED',
        })
    return {
        'rows': rows, 'ticket_commits': ticket_commits,
        'ticket_states': {t: 'PROVENANCE_FOUND' if refs else 'NO_PROVENANCE_FOUND' for t, refs in ticket_commits.items()},
        'diagnostic_errors': errors,
        'unresolved_commits': [(r['repository'], r['commit']) for r in rows if r['accounting'] == 'UNTRACED'],
        'diagnostic_consumer_effect': 'INCOMPLETE' if errors or any(r['accounting'] == 'UNTRACED' for r in rows) else 'ACCOUNTING_ONLY_NO_CLOSURE_CLAIM',
    }
