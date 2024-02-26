"use client"

import { useEditor } from '@/providers/editor/editor-provider';

export function LayersTab() {
  const { state, dispatch } = useEditor();

  // @FIXME: Need to get this to recursively render the layers as a file tree in the left sidebar of the funnel page editor.

  const renderElements = (elements: any, depth: number = 0, parentSelected: boolean = false) => {
    return elements.map((element: any) => {
      const isSelected = state.editor.selectedElement.id === element.id;
      const backgroundColor = isSelected ? 'yellow' : 'transparent';
      const color = isSelected ? 'black' : 'white';
      const transition = isSelected ? 'background-color 0.5s' : '';

      const handleClick = () => {
        dispatch({
          type: 'CHANGE_CLICKED_ELEMENT',
          payload: element.id
        });
      };

      return (
        <div key={element.id}>
          <div className='text-sm p-1' style={{
            marginLeft: `${depth * 2}px`,
            backgroundColor,
            transition,
            color
          }}
            onClick={handleClick}>{element.name}
          </div>
          {element.content && renderElements(element.content, depth + 1, isSelected)}
        </div>
      );
    });
  };

  return <div>{renderElements(state.editor.elements)}</div>;
}
