import { FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { AxiosError } from 'axios';
import { MdDeleteOutline, MdOutlineModeEditOutline, MdOutlineSave } from 'react-icons/md';

import { Button, Card, DataTable, Dialog, FormInput, FormTextarea, Icon, Label, Track } from 'components';
import { RESPONSE_TEXT_LENGTH } from 'constants/config';
import type { Responses as ResponsesType } from 'types/response';
import useDocumentEscapeListener from 'hooks/useDocumentEscapeListener';
import { useToast } from 'hooks/useToast';
import { addResponse, deleteResponse, editResponse } from 'services/responses';

type NewResponse = {
  name: string;
  text: string;
}

const Responses: FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: responses } = useQuery<ResponsesType>({
    queryKey: ['responses'],
  });
  const [addFormVisible, setAddFormVisible] = useState(false);
  const [editableRow, setEditableRow] = useState<{ id: string | number; text: string; } | null>(null);
  const [deletableRow, setDeletableRow] = useState<string | number | null>(null);
  const [filter, setFilter] = useState('');
  const { register, handleSubmit } = useForm<NewResponse>();

  const formattedResponses = useMemo(() => responses ? Object.keys(responses).map((r, i) => ({
    id: i,
    response: r,
    text: responses[r].text,
  })) : [], [responses]);

  useDocumentEscapeListener(() => setEditableRow(null));

  const responseSaveMutation = useMutation({
    mutationFn: ({ id, text }: { id: string | number, text: string }) => editResponse(id, { text }),
    onSuccess: async () => {
      await queryClient.invalidateQueries(['responses']);
      toast.open({
        type: 'success',
        title: t('global.notification'),
        message: 'Response saved',
      });
    },
    onError: (error: AxiosError) => {
      toast.open({
        type: 'error',
        title: t('global.notificationError'),
        message: error.message,
      });
    },
    onSettled: () => setEditableRow(null),
  });

  const responseDeleteMutation = useMutation({
    mutationFn: ({ id }: { id: string | number }) => deleteResponse(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries(['responses']);
      toast.open({
        type: 'success',
        title: t('global.notification'),
        message: 'Response deleted',
      });
    },
    onError: (error: AxiosError) => {
      toast.open({
        type: 'error',
        title: t('global.notificationError'),
        message: error.message,
      });
    },
    onSettled: () => setDeletableRow(null),
  });

  const newResponseMutation = useMutation({
    mutationFn: (data: NewResponse) => {
      const newResponseData = {
        ...data,
        name: 'utter_' + data.name,
      };
      return addResponse(newResponseData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(['responses']);
      setAddFormVisible(false);
      toast.open({
        type: 'success',
        title: t('global.notification'),
        message: 'New response added',
      });
    },
    onError: (error: AxiosError) => {
      toast.open({
        type: 'error',
        title: t('global.notificationError'),
        message: error.message,
      });
    },
  });

  const handleNewResponseSubmit = handleSubmit(async (data) => {
    newResponseMutation.mutate(data);
  });

  const handleEditableRow = async (response: { id: string | number; text: string }) => {
    setEditableRow(response);
  };

  const columnHelper = createColumnHelper<typeof formattedResponses[0]>();

  const responsesColumns = useMemo(() => [
    columnHelper.accessor('response', {
      header: t('training.responses.response') || '',
      meta: {
        size: '1%',
      },
    }),
    columnHelper.display({
      id: 'dependencies',
      cell: () => (
        <Label tooltip={
          <>
            {/* TODO: Add correct dependencies */}
            <strong>{t('global.dependencies')}</strong>
            <p>Dep 1</p>
            <p>Dep 2</p>
          </>
        }>
          {t('global.dependencies')}
        </Label>
      ),
      meta: {
        size: '1%',
      },
    }),
    columnHelper.accessor('text', {
      header: '',
      cell: (props) => editableRow && editableRow.id === props.row.original.id ? (
        <FormTextarea
          label='label'
          name='name'
          defaultValue={props.getValue()}
          hideLabel
          minRows={1}
          maxLength={RESPONSE_TEXT_LENGTH}
          showMaxLength
        />
      ) : (
        <p>{props.getValue()}</p>
      ),
      enableSorting: false,
    }),
    columnHelper.display({
      header: '',
      cell: (props) => (
        <>
          {editableRow && editableRow.id === props.row.original.id ? (
            <Button appearance='text'
                    onClick={() => responseSaveMutation.mutate(editableRow)}>
              <Icon label={t('global.save')} icon={<MdOutlineSave color={'rgba(0,0,0,0.54)'} />} />
              {t('global.save')}
            </Button>
          ) : (
            <Button
              appearance='text'
              onClick={() => handleEditableRow({ id: props.row.original.id, text: props.row.original.text })}
            >
              <Icon label={t('global.edit')} icon={<MdOutlineModeEditOutline color={'rgba(0,0,0,0.54)'} />} />
              {t('global.edit')}
            </Button>
          )}
        </>
      ),
      id: 'edit',
      meta: {
        size: '1%',
      },
    }),
    columnHelper.display({
      id: 'delete',
      cell: (props) => (
        <Button appearance='text' onClick={() => setDeletableRow(props.row.original.id)}>
          <Icon label={t('global.delete')} icon={<MdDeleteOutline color={'rgba(0,0,0,0.54)'} />} />
          {t('global.delete')}
        </Button>
      ),
      meta: {
        size: '1%',
      },
    }),
  ], [columnHelper, editableRow, t]);

  if (!responses) return <>Loading...</>;

  return (
    <>
      <h1>{t('training.responses.title')}</h1>

      <Card>
        <Track gap={16}>
          <FormInput
            label={t('training.responses.searchResponse')}
            name='responseSearch'
            placeholder={t('training.responses.searchResponse') + '...'}
            hideLabel
            onChange={(e) => setFilter(e.target.value)}
          />
          <Button onClick={() => setAddFormVisible(true)}>
            {t('global.add')}
          </Button>
        </Track>
      </Card>

      {addFormVisible && (
        <Card>
          <Track justify='between' gap={16}>
            <div style={{ flex: 1 }}>
              <Track gap={16}>
                <p>utter_</p>
                <FormInput
                  {...register('name')}
                  label={t('training.responses.responseName')}
                  hideLabel
                />
                <FormTextarea
                  {...register('text')}
                  label={t('training.responses.responseText')}
                  placeholder={t('training.responses.newResponseTextPlaceholder') || ''}
                  minRows={1}
                  hideLabel
                  maxLength={RESPONSE_TEXT_LENGTH}
                  showMaxLength
                />
              </Track>
            </div>
            <Track gap={16}>
              <Button appearance='secondary' onClick={() => setAddFormVisible(false)}>{t('global.cancel')}</Button>
              <Button onClick={handleNewResponseSubmit}>{t('global.save')}</Button>
            </Track>
          </Track>
        </Card>
      )}

      <Card>
        <DataTable
          data={formattedResponses}
          columns={responsesColumns}
          sortable
          globalFilter={filter}
          setGlobalFilter={setFilter}
        />
      </Card>

      {/* TODO: Refactor dialog content */}
      {deletableRow !== null && (
        <Dialog
          title={t('training.responses.deleteResponse')}
          onClose={() => setDeletableRow(null)}
          footer={
            <>
              <Button appearance='secondary' onClick={() => setDeletableRow(null)}>{t('global.no')}</Button>
              <Button
                appearance='error'
                onClick={() => responseDeleteMutation.mutate({ id: deletableRow })}
              >
                {t('global.yes')}
              </Button>
            </>
          }
        >
          <p>{t('global.removeValidation')}</p>
        </Dialog>
      )}
    </>
  );
};

export default Responses;
