import {
  Dropdown,
  CreateSessionModal,
  ConfirmDialog,
  Modal,
  Button
} from '@/components';
import ThemeToggle from './ThemeToggle';
import { useWorkspaceStore } from '@/stores';
import { useNavigate, useLocation } from 'react-router-dom';
import { SessionStatus } from '@/types/entities';
import { sessionsApi, agentsApi } from '@/api';
import { useState } from 'react';
import { PlusIcon, AlertCircleIcon } from 'lucide-react';
import SessionStatusIndicator from './SessionStatusIndicator';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] =
    useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    sessionId: number | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    sessionId: null
  });
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [requirementsMessage, setRequirementsMessage] = useState('');
  const [isCheckingRequirements, setIsCheckingRequirements] = useState(false);
  const {
    sessions,
    workspaces,
    activeWorkspaceId,
    activeSessionId,
    addSession,
    removeSession
  } = useWorkspaceStore();

  const handlePlusClick = async () => {
    setIsCheckingRequirements(true);

    // Check if workspaces exist
    if (!workspaces || workspaces.length === 0) {
      setRequirementsMessage(
        'You need to create at least one workspace before creating a session. Go to Workspaces to create one.'
      );
      setShowRequirementsModal(true);
      setIsCheckingRequirements(false);
      return;
    }

    // Check if agents exist (always check fresh)
    let agentsExist = false;
    try {
      const agentsData = await agentsApi.getAll();
      agentsExist = agentsData.length > 0;
    } catch (error) {
      console.error('Failed to check agents:', error);
      agentsExist = false;
    }

    if (!agentsExist) {
      setRequirementsMessage(
        'You need to create at least one agent before creating a session. Go to Agents to create one.'
      );
      setShowRequirementsModal(true);
      setIsCheckingRequirements(false);
      return;
    }

    // All requirements met, open the create session modal
    setIsCreateSessionModalOpen(true);
    setIsCheckingRequirements(false);
  };

  const handleCreateSession = async (data: {
    workspaceId: number;
    starterGitBranch: string;
    agentId: number;
    name?: string | null;
  }) => {
    const newSession = await sessionsApi.create(data);
    addSession(newSession);
    setIsCreateSessionModalOpen(false);
    navigate(`/session/${newSession.id}`);
  };

  const handleCloseSession = (sessionId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Session',
      message:
        'Are you sure you want to cancel this session? All progress and changes will be lost.',
      sessionId
    });
  };

  const handleConfirmCancelSession = async () => {
    if (confirmDialog.sessionId) {
      try {
        await sessionsApi.cancelSession(confirmDialog.sessionId);
        // Remove the session from global state
        removeSession(confirmDialog.sessionId);
        // Navigate away if we're currently viewing this session
        if (activeSessionId === confirmDialog.sessionId) {
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to cancel session:', error);
      }
    }
    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
      sessionId: null
    });
  };

  const handleCancelDialog = () => {
    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
      sessionId: null
    });
  };

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="relative h-8 w-8">
              <div className="absolute w-full h-full flex items-center justify-center z-1">
                <span
                  className="text-white font-mono"
                  style={{ letterSpacing: -2 }}>
                  {'</>'}
                </span>
              </div>
              <div className="h-8 w-8 rounded-full magic-icon flex items-center justify-center"></div>
            </div>
            <span className="text-lg font-normal! text-neutral-900 dark:text-neutral-100 font-mono">
              polygent
            </span>
          </div>

          <div className="flex items-center">
            {sessions
              .filter(
                (session) =>
                  session.status === SessionStatus.Waiting ||
                  session.status === SessionStatus.InProgress
              )
              .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
              .map((session) => (
                <div
                  key={session.id}
                  className={
                    (activeSessionId === session.id &&
                    location.pathname.startsWith('/session/')
                      ? 'bg-purple-100 dark:bg-purple-900/80 '
                      : 'hover:bg-neutral-200 dark:hover:bg-neutral-600 ') +
                    'flex items-center space-x-2 px-3 py-3 text-sm border-l border-neutral-200 dark:border-neutral-700'
                  }
                  onClick={() => navigate(`/session/${session.id}`)}>
                  <SessionStatusIndicator session={session} />
                  <span className="mr-2">
                    {session.name || `Session #${session.id}`}
                  </span>
                  <button
                    className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 ml-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseSession(session.id);
                    }}>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}

            <div
              className={`hover:bg-neutral-200 dark:hover:bg-neutral-600 flex items-center px-3 py-3 border-x border-neutral-200 dark:border-neutral-700 ${isCheckingRequirements ? 'cursor-wait' : 'cursor-pointer'}`}
              style={{ height: 38 }}
              onClick={handlePlusClick}>
              <PlusIcon size={14} />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <ThemeToggle />

          <Dropdown
            options={[
              { value: 'home', label: 'Home' },
              { value: 'workspaces', label: 'Workspaces' },
              { value: 'agents', label: 'Agents' },
              { value: 'backlogs', label: 'Backlogs' }
              // { value: 'mcps', label: 'MCPs' }
            ]}
            placeholder="Menu"
            onSelect={(option) => {
              navigate(option.value === 'home' ? '/' : `/${option.value}`);
            }}
            dropdownWidth="w-40"
            alignRight={true}
          />
        </div>
      </div>

      <CreateSessionModal
        isOpen={isCreateSessionModalOpen}
        activeWorkspaceId={activeWorkspaceId}
        onCreateSession={handleCreateSession}
        onCancel={() => setIsCreateSessionModalOpen(false)}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant="danger"
        onConfirm={handleConfirmCancelSession}
        onCancel={handleCancelDialog}
      />

      <Modal
        isOpen={showRequirementsModal}
        onClose={() => setShowRequirementsModal(false)}
        title="Requirements Missing"
        icon={<AlertCircleIcon className="h-6 w-6 text-yellow-500" />}
        size="sm"
        contentClassName="p-6"
        footer={
          <Button onClick={() => setShowRequirementsModal(false)}>
            Got it
          </Button>
        }>
        <div className="text-neutral-700 dark:text-neutral-300">
          {requirementsMessage}
        </div>
      </Modal>
    </header>
  );
}
